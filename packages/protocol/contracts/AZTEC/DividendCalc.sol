pragma solidity ^0.4.24;

library DividendCalcInterface {
    function validateDividendCalc(bytes32[18], uint, uint, uint, bytes32[4]) external pure returns (bool) {}
}

/**
 * @title Library to validate AZTEC dividend computation proofs
 * @author AZTEC
 * @dev Don't include this as an internal library. This contract uses a static memory table 
 * to cache elliptic curve primitives and hashes.
 * Calling this internally from another function will lead to memory mutation and undefined behaviour.
 * The intended use case is to call this externally via `staticcall`. External calls to OptimizedAZTEC 
 * can be treated as pure functions as this contract contains no storage and makes no external calls 
 * (other than to precompiles).
 * Copyright Spilbury Holdings Ltd 2018. All rights reserved.
 **/
contract DividendCalc {
    /**
     * @dev This will take any dividend calculation proof data and attempt to verify it in zero-knowledge
     * If the proof is not valid, the transaction will throw.
     * @notice See DividendCalcInterface for how method calls should be constructed.
     * DividendCalc is written in YUL to enable manual memory management and for other efficiency savings.
     **/
    function() external payable {
        assembly {

            // We don't check for function signatures, there's only one function 
            // that ever gets called: validateDividendCalc()
            // We still assume calldata is offset by 4 bytes so that we can 
            // represent this contract through a compatible ABI
            validateDividendCalc()

            // should not get here
            mstore(0x00, 404)
            revert(0x00, 0x20)

            /**
             * @dev Validate an AZTEC protocol dividend calculation
             * Calldata Map is
             * 0x04:0x244       = calldata location of ```note``` static array
             * 0x244:0x264      = Fiat-Shamir heuristicified random challenge
             * 0x264:0x284      = z_a
             * 0x284:0x2a4      = z_b
             * 0x2a4:0x324      = G2 element t2, the trusted setup public key
             * 
             * Note data map (uint[6]) is
             * 0x00:0x20       = Z_p element \bar{k}_i
             * 0x20:0x40       = Z_p element \bar{a}_i
             * 0x40:0x80       = G1 element \gamma_i
             * 0x80:0xc0       = G1 element \sigma_i
             *
             * We use a hard-coded memory map to reduce gas costs - if this is not called 
             * as an external contract then terrible things will happen!
             * 0x00:0x20       = scratch data to store result of keccak256 calls
             * 0x20:0x80       = scratch data to store \gamma_i and a multiplication scalar
             * 0x80:0xc0       = x-coordinate of generator h
             * 0xc0:0xe0       = y-coordinate of generator h
             * 0xe0:0x100      = scratch data to store a scalar we plan to multiply h by
             * 0x100:0x160     = scratch data to store \sigma_i and a multiplication scalar
             * 0x160:0x1a0     = stratch data to store result of G1 point additions
             * 0x1a0:0x1c0     = scratch data to store result of \sigma_i^{-cx_{i-m-1}}
             * 0x1c0:0x200     = location of pairing accumulator \sigma_{acc}, 
             *                   where \sigma_{acc} = \prod_{i=m}^{n-1}\sigma_i^{cx_{i-m-1}}
             * 0x220:0x260     = scratch data to store \gamma_i^{cx_{i-m-1}}
             * 0x260:0x2a0     = location of pairing accumulator \gamma_{acc}, 
             *                    where \gamma_{acc} = \prod_{i=m}^{n-1}\gamma_i^{cx_{i-m-1}}
             * 0x2a0:0x2c0     = msg.sender (contract should be called via delegatecall/staticcall)
             * 0x2c0:0x2e0     = z_a (memory used to reconstruct hash starts here)
             * 0x2e0:0x300     = z_b
             * 0x300:???       = block of memory that contains (\gamma_i, \sigma_i)_{i=0}^{n-1} 
             *                   concatenated with (B_i)_{i=0}^{n-1}
             **/


            function validateDividendCalc() {
                
                /*
                ///////////////////////////////////////////  SETUP  //////////////////////////////////////////////
                */
                mstore(0x80, 7673901602397024137095011250362199966051872585513276903826533215767972925880) // h_x
                
                mstore(0xa0, 8489654445897228341090914135473290831551238522473825886865492707826370766375) // h_y
                let gen_order := 0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001                

                
                let notes := 0x04 // call data location of start of ```note``` array
                let challenge := mod(calldataload(0x244), gen_order)


                // Check that za < kMax
                if gt(calldataload(0x264), 1048576) {
                    mstore(0x00, 400)
                    revert(0x00, 0x20)
                }

                // Check that zb < kMax
                if gt(calldataload(0x284), 1048576) {
                    mstore(0x00, 400)
                    revert(0x00, 0x20)
                }


                let za := mod(calldataload(0x264), gen_order)
                let zb := mod(calldataload(0x284), gen_order)

                /*
                m is the deliminator between input and output notes. 
                We only have one input note, and then the next two are output notes.

                m = 0 and n = 3

                Variables not defined and instead hard-coded, to save on stack depth
                */

                // add caller, za and zb to final hash table
                mstore(0x2a0, caller)
                mstore(0x2c0, za)
                mstore(0x2e0, zb)
                hashCommitments(notes)
                let b := 0x480 

                /*
                ///////////////////////////  CALCULATE BLINDING FACTORS  /////////////////////////////////////
                */

                // Iterate over every note and calculate the blinding factor B_i = \gamma_i^{kBar}h^{aBar}\sigma_i^{-c}.
                // We use the AZTEC protocol pairing optimization to reduce the number of pairing comparisons to 1.
                // This adds some minor alterations
                for { let i := 0 } lt(i, 3) { i := add(i, 0x01) } {

                    // Get the calldata index of this note - call data location of start of note
                    let noteIndex := add(notes, mul(i, 0xc0)) 

                    // Define variables k, a and c.
                    // If i <= m then - input notes
                    //   k = kBar_i
                    //   a = aBar_i
                    //   c = challenge
                    // If i > m then we add a modification for the pairing optimization
                    //   k = kBar_i * x_i
                    //   a = aBar_i * x_i
                    //   c = challenge * x_i
                    // Set j = i - (m + 1). - index to count the output commitment
                    // x_0 = 1
                    // x_1 = keccak256(input string)
                    // all other x_{j} = keccak256(x_{j-1})
                    // The reason for doing this is that the point  \sigma_i^{-cx_j} can be re-used in the pairing check
                    // Instead of validating e(\gamma_i, t_2) == e(\sigma_i, g_2) for all i = [m+1,\ldots,n]
                    // We instead validate:
                    // e(\Pi_{i=m+1}^{n}\gamma_i^{-cx_j}, t_2) == e(\Pi_{i=m+1}^{n}\sigma_i^{cx_j}, g_2).
                    // x_j is a pseudorandom variable whose entropy source is the input string, allowing for
                    // a sum of commitment points to be evaluated in one pairing comparison

                    let k
                    let a := calldataload(add(noteIndex, 0x20))
                    let c := challenge

                    switch gt(i, 1)
                    case 1 { // output note
                        /*
                        Enforce the condition k_3 = (k_1)(z_b) - (k_2)(z_a)
                        */
                        k := addmod(
                                    mulmod(
                                        calldataload(sub(noteIndex, add(0xc0, 0xc0))),
                                        zb,
                                        gen_order), // k_1 * z_b
                                    mulmod(
                                        sub(gen_order, calldataload(sub(noteIndex, 0xc0))),
                                        za,
                                        gen_order), //-(k_2 * z_a)
                                    gen_order)       
                    }

                    case 0 { // input note
                        /*
                        Input commitments just have the k factors as according to the note data
                        */  
                        k := calldataload(noteIndex)
                    }


                    // Set k = kx_j, a = ax_j, c = cx_j, where j = i - (m+1)
                    let x := mod(mload(0x00), gen_order) // x is the keccak hash of the input commitments
                    k := mulmod(k, x, gen_order) // kx
                    a := mulmod(a, x, gen_order) // ax
                    c := mulmod(challenge, x, gen_order) // cx
                    mstore(0x1000, x) // todo remove
                    // calculate x_{j+1}
                    mstore(0x00, keccak256(0x00, 0x20)) // rehashing the keccak hash, for use in the next x


                    // Check this commitment is well formed
                    validateCommitment(noteIndex, k, a)

                    // Calculate the G1 element \gamma_i^{k}h^{a}\sigma_i^{-c} = B_i - already has all x stuff
                    // Memory map:
                    // 0x20: \gamma_iX
                    // 0x40: \gamma_iY
                    // 0x60: k_i
                    // 0x80: hX
                    // 0xa0: hY
                    // 0xc0: a_i
                    // 0xe0: \sigma_iX
                    // 0x100: \sigma_iY
                    // 0x120: -c

                    // loading key variables into memory to be operated on later
                    calldatacopy(0xe0, add(noteIndex, 0x80), 0x40)  
                    calldatacopy(0x20, add(noteIndex, 0x40), 0x40)
                    mstore(0x120, sub(gen_order, c))
                    mstore(0x60, k) 
                    mstore(0xc0, a)

                    // Call bn128 scalar multiplication precompiles
                    // Represent point + multiplication scalar in 3 consecutive blocks of memory
                    // Store \sigma_i^{-c} at 0x1a0:0x200
                    // Store \gamma_i^{k} at 0x120:0x160
                    // Store h^{a} at 0x160:0x1a0
                    
                    // result is a boolean. It keeps track of whether the call to the pre-compile was 
                    // successful. True if it was, False if it wasn't
                    let result := staticcall(gas, 7, 0xe0, 0x60, 0x1a0, 0x40) // sigma_i^{-c}
                    result := and(result, staticcall(gas, 7, 0x20, 0x60, 0x120, 0x40)) // gamma_i^{k}
                    result := and(result, staticcall(gas, 7, 0x80, 0x60, 0x160, 0x40)) // h^{a}

                    // Call bn128 group addition precompiles
                    // \gamma_i^{k} and h^{a} in memory block 0x120:0x1a0
                    // Store result of addition at 0x160:0x1a0
                    result := and(result, staticcall(gas, 6, 0x120, 0x80, 0x160, 0x40))

                    // \gamma_i^{k}h^{a} and \sigma^{-c} in memory block 0x160:0x1e0
                    // Store resulting point B at memory index b
                    // index b points to the end of the block of memory containing commitments
                    // we're appending blinding factors to the end of the commitment block
                    result := and(result, staticcall(gas, 6, 0x160, 0x80, b, 0x40))

                    /*
                    calldatacopy(0xe0, add(noteIndex, 0x80), add(b, 0x40))  
                    calldatacopy(0x20, add(noteIndex, 0x40), add(b, 0x80))
                    mstore(add(b, 0xa0),
                        addmod(
                            mulmod(calldataload(sub(noteIndex, add(0xc0, 0xc0))), zb, gen_order), // k_1 * z_b
                            mulmod(sub(gen_order, calldataload(sub(noteIndex, 0xc0))), za, gen_order), // - (k_2 * z_a)
                            gen_order)      
                    )
                    mstore(add(b, 0xc0),
                    calldataload(add(noteIndex, 0x20)))
                    mstore(add(b, 0xe0), mload(0x1000))
                    return(b, 0xc0)
                    */
                    // We have \sigma^{-c} at 0x1a0:0x200
                    // And \sigma_{acc} at 0x1e0:0x200
                    // If i = m + 1 (i.e. first output note)
                    // then we set \gamma_{acc} and \sigma_{acc} to \gamma_i, -\sigma_i
                    // the accumulator is the variable that is used to condense the various pairing
                    // comparisons into a single one
                    if eq(i, 0) { // m = 0
                        mstore(0x260, mload(0x20))
                        mstore(0x280, mload(0x40))
                        mstore(0x1e0, mload(0xe0))
                        mstore(
                            0x200,
                            sub(0x30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47, mload(0x100))
                            )
                    }

                    // If i > m + 1 (i.e. subsequent output notes)
                    // then we add \sigma^{-c} and \sigma_{acc} and store result at \sigma_{acc} (0x1e0:0x200)
                    // we then calculate \gamma^{cx} and add into \gamma_{acc}
                    if gt(i, 0) { // m = 0
                        mstore(0x60, c)
                        result := and(result, staticcall(gas, 7, 0x20, 0x60, 0x220, 0x40))

                       // \gamma_i^{cx} now at 0x220:0x260, \gamma_{acc} is at 0x260:0x2a0
                        result := and(result, staticcall(gas, 6, 0x220, 0x80, 0x260, 0x40))

                       // add \sigma_i^{-cx} and \sigma_{acc} into \sigma_{acc} at 0x1e0
                        result := and(result, staticcall(gas, 6, 0x1a0, 0x80, 0x1e0, 0x40))
                    }

                    // throw transaction if any calls to precompiled contracts failed
                    if iszero(result) { mstore(0x00, 400) revert(0x00, 0x20) }
                    b := add(b, 0x40) // increase B pointer by 2 words
                }
                

                    validatePairing(0x2a4) // argument is just a hexadecimal number here. Used in the 
                                         //  function to give the call data location of the trusted setup
                                         //  public key

                // We now have the message sender, z_a, z_b, note commitments and the 
                // calculated blinding factors in a block of memory starting at 0x2a0, of size (b - 0x2a0).
                // Hash this block to reconstruct the initial challenge and validate that they match
                let expected := mod(keccak256(0x2a0, sub(b, 0x2a0)), gen_order)

                if iszero(eq(expected, challenge)) {
                    
                    // Proof failed
                    mstore(0x00, 404)
                    revert(0x00, 0x20)
                }

                // Great! All done. This is a valid proof so return ```true```
                mstore(0x00, 0x01)
                return(0x00, 0x20)
            }

            /**        
             * @dev evaluate if e(P1, t2) . e(P2, g2) == 0.
             * @notice we don't hard-code t2 so that contracts that call this library can use different trusted setups.
             **/
            function validatePairing(t2) {
                let field_order := 0x30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47
                let t2_x_1 := calldataload(t2)
                let t2_x_2 := calldataload(add(t2, 0x20))
                let t2_y_1 := calldataload(add(t2, 0x40))
                let t2_y_2 := calldataload(add(t2, 0x60))

                // check provided setup pubkey is not zero or g2
                if or(or(or(or(or(or(or(
                    iszero(t2_x_1),
                    iszero(t2_x_2)),
                    iszero(t2_y_1)),
                    iszero(t2_y_2)),
                    eq(t2_x_1, 0x1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed)),
                    eq(t2_x_2, 0x198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c2)),
                    eq(t2_y_1, 0x12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa)),
                    eq(t2_y_2, 0x90689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b))
                {
                    mstore(0x00, 400)
                    revert(0x00, 0x20)
                }

                // store coords in memory
                // indices are a bit off, scipr lab's libff limb ordering (c0, c1) is opposite
                // to what precompile expects. We can overwrite the memory we used previously as this function
                // is called at the end of the validation routine.
                mstore(0x20, mload(0x1e0)) // sigma accumulator x
                mstore(0x40, mload(0x200)) // sigma accumulator y
                mstore(0x80, 0x1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed)
                mstore(0x60, 0x198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c2)
                mstore(0xc0, 0x12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa)
                mstore(0xa0, 0x90689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b)
                mstore(0xe0, mload(0x260)) // gamma accumulator x
                mstore(0x100, mload(0x280)) // gamma accumulator y
                mstore(0x140, t2_x_1)
                mstore(0x120, t2_x_2)
                mstore(0x180, t2_y_1)
                mstore(0x160, t2_y_2)

                let success := staticcall(gas, 8, 0x20, 0x180, 0x20, 0x20)

                if or(iszero(success), iszero(mload(0x20))) {
                    mstore(0x00, 400)
                    revert(0x00, 0x20)
                }
            }

            /**
             * @dev check that this note's points are on the altbn128 curve(y^2 = x^3 + 3)
             * and that signatures 'k' and 'a' are modulo the order of the curve. 
             * Transaction will throw if this is not the case.
             * @param note the calldata loation of the note
             **/
            function validateCommitment(note, k, a) {
                let gen_order := 0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001
                let field_order := 0x30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47
                let gammaX := calldataload(add(note, 0x40))
                let gammaY := calldataload(add(note, 0x60))
                let sigmaX := calldataload(add(note, 0x80))
                let sigmaY := calldataload(add(note, 0xa0))
                if iszero(
                    and(
                        and(
                            and(
                                eq(mod(a, gen_order), a), // a is modulo generator order?
                                gt(a, 1)                  // can't be 0 or 1 either!
                            ),
                            and(
                                eq(mod(k, gen_order), k), // k is modulo generator order?
                                gt(k, 1)                  // and not 0 or 1
                            )
                        ),
                        and(
                            eq( // y^2 ?= x^3 + 3
                                addmod(
                                    mulmod(mulmod(sigmaX, sigmaX, field_order), sigmaX, field_order), 
                                    3, 
                                    field_order),
                                mulmod(sigmaY, sigmaY, field_order)
                            ),
                            eq( // y^2 ?= x^3 + 3
                                addmod(
                                    mulmod(mulmod(gammaX, gammaX, field_order), gammaX, field_order),
                                    3,
                                    field_order),
                                mulmod(gammaY, gammaY, field_order)
                            )
                        )
                    )
                ) {
                    mstore(0x00, 400)
                    revert(0x00, 0x20)
                }
            }

            /**
             * @dev Calculate the keccak256 hash of the commitments for both input notes and output notes.
             * This is used both as an input to validate the challenge `c` and also 
             * to generate pseudorandom relationships between commitments for different outputNotes, so 
             * that we can combine them into a single multi-exponentiation for the purposes of 
             * validating the bilinear pairing relationships.
             * @param notes calldata location of notes
             * @param n number of notes
             * 
             * @notice
             * This is iterating through each note. It first calculates an index 
             * for each note - the memory location in calldata where note data is stored. 
             *   
             * It then copies the next 128 bytes worth of data from the note, into the appropriate memory location
             *
             * Following this, we take the keccak hash of all the note data that we've copied over into memory. 
             *
             * We store the result of the keccak hash in memory location 0x00
             **/
            function hashCommitments(notes) {
                calldatacopy(0x300, add(notes, 0x40), 0x80)
                calldatacopy(0x380, add(notes, 0x100), 0x80)
                calldatacopy(0x400, add(notes, 0x1c0), 0x80)
                mstore(0x00, keccak256(0x300, 0x180))
            }
        }
    }
}
