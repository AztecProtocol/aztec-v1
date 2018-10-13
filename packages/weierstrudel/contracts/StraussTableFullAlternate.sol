pragma solidity ^0.4.23;

contract StraussTableFullAlternateInterface {
    function generateTablePure(uint[2][] points) public pure returns (uint[2][]) {}
}

/// @dev Ok! Time to generate a full precomputed table. What an unholy mess of nonsense...
contract StraussTableFullAlternate {
    
    function() external payable {
        assembly {

        // Ok, what the hell are we doing....
        // to start with we want to load up points...
        // we use 3 words as scratch space for the strauss_table_single algorithm, and 1 word for table pointer
        // also iterator storage, so we start our offset table at 0xa0
        // also return destination. Ok let's define some scratch space...
        // 0x00 - 0x60: strauss_single stratch space
        // 0x60 - 0x80: dz table pointer
        // 0x80 - 0xa0: iterator location
        // 0xa0 - 0xc0: jump destination scratch space
        // 0xc0 - 0xe0: precompute table pointer
        // 0xe0 - 0x100: some kind of iterator storage. who knows
        // 0xe0 - ???: dz table

            0x44 calldataload
            0x64 calldataload

        // to start with, we have an affine point 'x, y'.
        // we can immediately call 'straussTableSingle' with the relevant point coords on stack
            21888242871839275222246405745257275088696311157297823662689037894645226208583 dup2 dup1 mulmod
            21888242871839275222246405745257275088696311157297823662689037894645226208583 dup2 4 mul dup2 dup1 dup1
            dup4 dup9 mulmod swap7 dup1 mulmod 3 mul dup2 dup2 dup1 mulmod dup8 dup4 sub dup1 add add
            65664728615517825666739217235771825266088933471893470988067113683935678625749 sub dup1 0x00 mstore
            dup8 add mulmod swap3 mulmod 21888242871839275222246405745257275088696311157297823662689037894645226208583 sub
            dup1 add swap2 dup1 add 0x40 mstore dup2 add 0x20 mstore
            21888242871839275222246405745257275088696311157297823662689037894645226208583
            0x20 mload dup3 add 0x00 mload dup5 add
            dup3 dup1 dup3 dup1 mulmod
            dup1 iszero reject jumpi
            dup2 dup2 dup5 mulmod swap4 dup3 dup3 dup10 mulmod
            dup4 sub dup4 dup1 dup1 dup5 dup1 mulmod
            dup4 dup1 add add dup9 addmod swap2 dup3 add dup2 swap4 mulmod
            dup3 dup8 dup11 mulmod add 43776485743678550444492811490514550177392622314595647325378075789290452417166 sub dup3 swap6
            dup4 dup2 dup1 mulmod dup5 dup1 dup1 dup4 dup6 mulmod 0x20 mload mulmod
            dup5 add swap2 0x00 mload mulmod dup5 add
            dup6 dup1 dup3 dup1 mulmod dup1 iszero reject jumpi
            dup2 dup2 dup5 mulmod swap4 dup3 dup3 dup10 mulmod dup4 sub dup4 dup1
            dup1 dup5 dup1 mulmod dup4 dup1 add add dup9 addmod swap2
            dup3 add dup2 swap4 mulmod dup3 dup8 dup11 mulmod
            add 43776485743678550444492811490514550177392622314595647325378075789290452417166 sub
            dup3 dup1 swap7 dup2 swap10 mulmod
            dup4 dup2 dup1 mulmod dup5 dup1 dup1 dup4 dup6 mulmod 0x20 mload mulmod
            dup5 add swap2 0x00 mload mulmod dup5 add
            dup6 dup1 dup3 dup1 mulmod dup1 iszero reject jumpi
            dup2 dup2 dup5 mulmod swap4 dup3 dup3 dup10 mulmod dup4 sub dup4 dup1
            dup1 dup5 dup1 mulmod dup4 dup1 add add dup9 addmod swap2
            dup3 add dup2 swap4 mulmod dup3 dup8 dup11 mulmod
            add 43776485743678550444492811490514550177392622314595647325378075789290452417166 sub
            dup3 dup1 swap7 dup2 swap10 mulmod
            dup4 dup2 dup1 mulmod dup5 dup1 dup1 dup4 dup6 mulmod 0x20 mload mulmod
            dup5 add swap2 0x00 mload mulmod dup5 add
            dup6 dup1 dup3 dup1 mulmod dup1 iszero reject jumpi
            dup2 dup2 dup5 mulmod swap4 dup3 dup3 dup10 mulmod dup4 sub dup4 dup1
            dup1 dup5 dup1 mulmod dup4 dup1 add add dup9 addmod swap2
            dup3 add dup2 swap4 mulmod dup3 dup8 dup11 mulmod
            add 43776485743678550444492811490514550177392622314595647325378075789290452417166 sub
            dup3 dup1 swap7 dup2 swap10 mulmod
            dup4 dup2 dup1 mulmod dup5 dup1 dup1 dup4 dup6 mulmod 0x20 mload mulmod
            dup5 add swap2 0x00 mload mulmod dup5 add
            dup6 dup1 dup3 dup1 mulmod dup1 iszero reject jumpi
            dup2 dup2 dup5 mulmod swap4 dup3 dup3 dup10 mulmod dup4 sub dup4 dup1
            dup1 dup5 dup1 mulmod dup4 dup1 add add dup9 addmod swap2
            dup3 add dup2 swap4 mulmod dup3 dup8 dup11 mulmod
            add 43776485743678550444492811490514550177392622314595647325378075789290452417166 sub
            dup3 dup1 swap7 dup2 swap10 mulmod
            dup4 dup2 dup1 mulmod dup5 dup1 dup1 dup4 dup6 mulmod 0x20 mload mulmod
            dup5 add swap2 0x00 mload mulmod dup5 add
            dup6 dup1 dup3 dup1 mulmod dup1 iszero reject jumpi
            dup2 dup2 dup5 mulmod swap4 dup3 dup3 dup10 mulmod dup4 sub dup4 dup1
            dup1 dup5 dup1 mulmod dup4 dup1 add add dup9 addmod swap2
            dup3 add dup2 swap4 mulmod dup3 dup8 dup11 mulmod
            add 43776485743678550444492811490514550177392622314595647325378075789290452417166 sub
            dup3 dup1 swap7 dup2 swap10 mulmod
            dup4 dup2 dup1 mulmod dup5 dup1 dup1 dup4 dup6 mulmod 0x20 mload mulmod // (54)
            dup5 add swap2 0x00 mload mulmod dup5 add // (29)
            dup6 dup1 dup3 dup1 mulmod dup1 iszero reject jumpi dup2 dup2 dup5 mulmod swap4 // (40)
            dup3 dup3 dup10 mulmod dup4 sub dup4 dup1 // (29)
            dup1 dup5 dup1 mulmod dup4 dup1 add add dup9 addmod swap2 // (43)
            dup3 add dup2 swap4 mulmod dup3 dup8 dup11 mulmod // (37)
            add 43776485743678550444492811490514550177392622314595647325378075789290452417166 sub // (9)
            dup3 dup1 dup1 swap8 dup2 swap11 mulmod 0x40 mload mulmod

        0x84 0x60 mstore                      // store iterator
        0x24 calldataload 1 eq rescale_loop_start jumpi   // i = size of array
        0x84                               // push iterator onto stack
// ###  
    main_loop_start:    // stack state i z
            21888242871839275222246405745257275088696311157297823662689037894645226208583
            dup1 dup4 dup1 mulmod   // zz p i z
            dup2 dup1 dup1 dup4 // zz p p p zz p i z
            dup8 mulmod         // zzz p p zz p i z
            dup6 0x20 add calldataload mulmod // y' p zz p i z
            swap2 dup5 calldataload mulmod    // x' y' p i z
            swap3 pop dup2                    // p y' p x' z
// -y?
//  ### strauss table single
            dup1 dup3 dup1 mulmod dup2 dup2 4 mul
            dup2 dup1 dup3 dup10 mulmod dup2 sub
            dup2 dup10 dup1 mulmod 3 mul
            swap1 dup3 dup3 dup1 mulmod dup2 dup1 add
            add dup1 65664728615517825666739217235771825266088933471893470988067113683935678625749 sub 0x00 mstore
            add mulmod swap3 mulmod dup1 add add 65664728615517825666739217235771825266088933471893470988067113683935678625749 sub 0x20 mstore
            dup1 dup6 dup1 add dup4 mulmod dup1 0x40 mstore dup2 dup1 dup3 dup1 mulmod
            swap6 dup7 mulmod swap5 mulmod mulmod
            21888242871839275222246405745257275088696311157297823662689037894645226208583 sub swap1 swap2       // z -y x
            21888242871839275222246405745257275088696311157297823662689037894645226208583
            dup2 dup1 mulmod 21888242871839275222246405745257275088696311157297823662689037894645226208583
            dup1 dup1 dup4 dup6 mulmod 0x20 mload mulmod dup5 add swap2 0x00 mload mulmod
            dup5 add dup1 21888242871839275222246405745257275088696311157297823662689037894645226208583 eq reject jumpi
            21888242871839275222246405745257275088696311157297823662689037894645226208583 dup1 dup3 dup1 mulmod
            dup2 dup2 dup5 mulmod swap4
            dup3 dup3 dup10 mulmod dup4 sub
            dup4 dup1 dup1 dup5 dup1 mulmod
            dup4 dup1 add add dup9 addmod
            swap2 dup3 add dup2 swap4 mulmod
            dup3 dup8 dup11 mulmod
            add 43776485743678550444492811490514550177392622314595647325378075789290452417166 sub
            dup3 dup1 swap7 dup2 swap10 mulmod
            dup4 dup2 dup1 mulmod dup5 dup1 dup1 dup4 dup6 mulmod 0x20 mload mulmod
            dup5 add swap2 0x00 mload mulmod dup5 add
            dup1 dup6 eq reject jumpi
            dup6 dup1 dup3 dup1 mulmod dup2 dup2 dup5 mulmod swap4
            dup3 dup3 dup10 mulmod dup4 sub dup4 dup1
            dup1 dup5 dup1 mulmod dup4 dup1 add add dup9 addmod swap2
            dup3 add dup2 swap4 mulmod dup3 dup8 dup11 mulmod
            add 43776485743678550444492811490514550177392622314595647325378075789290452417166 sub
            dup3 dup1 swap7 dup2 swap10 mulmod
            dup4 dup2 dup1 mulmod dup5 dup1 dup1 dup4 dup6 mulmod 0x20 mload mulmod
            dup5 add swap2 0x00 mload mulmod dup5 add
            dup1 dup6 eq reject jumpi
            dup6 dup1 dup3 dup1 mulmod dup2 dup2 dup5 mulmod swap4
            dup3 dup3 dup10 mulmod dup4 sub dup4 dup1
            dup1 dup5 dup1 mulmod dup4 dup1 add add dup9 addmod swap2
            dup3 add dup2 swap4 mulmod dup3 dup8 dup11 mulmod
            add 43776485743678550444492811490514550177392622314595647325378075789290452417166 sub
            dup3 dup1 swap7 dup2 swap10 mulmod
            dup4 dup2 dup1 mulmod dup5 dup1 dup1 dup4 dup6 mulmod 0x20 mload mulmod
            dup5 add swap2 0x00 mload mulmod dup5 add
            dup1 dup6 eq reject jumpi
            dup6 dup1 dup3 dup1 mulmod dup2 dup2 dup5 mulmod swap4
            dup3 dup3 dup10 mulmod dup4 sub dup4 dup1
            dup1 dup5 dup1 mulmod dup4 dup1 add add dup9 addmod swap2
            dup3 add dup2 swap4 mulmod dup3 dup8 dup11 mulmod
            add 43776485743678550444492811490514550177392622314595647325378075789290452417166 sub
            dup3 dup1 swap7 dup2 swap10 mulmod
            dup4 dup2 dup1 mulmod dup5 dup1 dup1 dup4 dup6 mulmod 0x20 mload mulmod
            dup5 add swap2 0x00 mload mulmod dup5 add
            dup1 dup6 eq reject jumpi
            dup6 dup1 dup3 dup1 mulmod dup2 dup2 dup5 mulmod swap4
            dup3 dup3 dup10 mulmod dup4 sub dup4 dup1
            dup1 dup5 dup1 mulmod dup4 dup1 add add dup9 addmod swap2
            dup3 add dup2 swap4 mulmod dup3 dup8 dup11 mulmod
            add 43776485743678550444492811490514550177392622314595647325378075789290452417166 sub
            dup3 dup1 swap7 dup2 swap10 mulmod
            dup4 dup2 dup1 mulmod dup5 dup1 dup1 dup4 dup6 mulmod 0x20 mload mulmod
            dup5 add swap2 0x00 mload mulmod dup5 add
            dup1 dup6 eq reject jumpi
            dup6 dup1 dup3 dup1 mulmod dup2 dup2 dup5 mulmod swap4
            dup3 dup3 dup10 mulmod dup4 sub dup4 dup1
            dup1 dup5 dup1 mulmod dup4 dup1 add add dup9 addmod swap2
            dup3 add dup2 swap4 mulmod dup3 dup8 dup11 mulmod
            add 43776485743678550444492811490514550177392622314595647325378075789290452417166 sub
            dup3 dup1 swap7 dup2 swap10 mulmod
            dup4 dup2 dup1 mulmod dup5 dup1 dup1 dup4 dup6 mulmod 0x20 mload mulmod
            dup5 add swap2 0x00 mload mulmod dup5 add
            dup1 dup6 eq reject jumpi
            dup6 dup1 dup3 dup1 mulmod dup2 dup2 dup5 mulmod swap4
            dup3 dup3 dup10 mulmod dup4 sub dup4 dup1
            dup1 dup5 dup1 mulmod dup4 dup1 add add dup9 addmod swap2
            dup3 add dup2 swap4 mulmod dup3 dup8 dup11 mulmod
            add 43776485743678550444492811490514550177392622314595647325378075789290452417166 sub
            dup3 dup1 dup1 swap8 dup2 swap11 mulmod 0x40 mload mulmod


            0x60 mload 0x40 add dup1 0x60 mstore    // update iterator
            calldatasize dup2 lt main_loop_start jumpi
            // pop // get rid of iterator
        0x100 0x80 mstore
        pop
        rescale_loop_start:
            // so what does the main loop look like?????
            // 1st we need to store the top 3 coordinates
            // let's start with storing globala z at 0x00
            0x00 mstore
            // might as well store 1st coordinate points at 0x100 and 0x120 (this is P15). TODO will need more sophisticated storage routine
            0x120 mstore
            0x100 mstore
            // stack state: p dz2 p p dz3 p y x
            // TODO. optimize end-loop to not have this?
            pop
            // dz2 p p dz3 p y x
            swap6
            // x p p dz3 p y dx2
            dup7
            // dz2 x p p dz3 p y dz2
            mulmod
            // x' p dz3 p y dz
            0x80 mload 0x40 add mstore
            // p dz3 p y dz2
            pop
            swap2
            // y p dz3 dz2
            dup3 mulmod
            // y' dz3 dz2
            0x80 mload 0x60 add mstore // this is already wrong. am I storing dz3?
            // dz3 dz2 p dz2' p p dz3' p y x
            swap3
            // dz2' dz2 p dz3 p p dz3' p y x
            mulmod
            // dz2'' dz3' p p dz3' p y x
            swap4 mulmod
            // dz3'' p dz2'' p y x
            swap4
            // y p dz2'' p dz3'' x
            dup5 mulmod
            // y' dz2'' p dz3'' x
            0x80 mload 0xa0 add mstore
            // dz2'' p dz3'' x
            swap3
            // x p dz3'' dz2''
            dup4 mulmod
            // x' dz3'' dz2''
            0x80 mload 0x80 add mstore

            // P9 vv this throws an error
            swap3 mulmod swap4 mulmod swap4 dup5 mulmod 0x80 mload 0xe0 add mstore
            swap3 dup4 mulmod 0x80 mload 0xc0 add mstore
            // P7 vv
            swap3 mulmod swap4 mulmod swap4 dup5 mulmod 0x80 mload 0x120 add mstore
            swap3 dup4 mulmod 0x80 mload 0x100 add mstore
            // P5 vv
            swap3 mulmod swap4 mulmod swap4 dup5 mulmod 0x80 mload 0x160 add mstore
            swap3 dup4 mulmod 0x80 mload 0x140 add mstore
            // P3 vv
            swap3 mulmod swap4 mulmod swap4 dup5 mulmod 0x80 mload 0x1a0 add mstore
            swap3 dup4 mulmod 0x80 mload 0x180 add mstore
            // P1 vv
            swap3 mulmod swap4 mulmod swap4 dup5 mulmod 0x80 mload 0x1e0 add mstore
            swap3 dup4 mulmod 0x80 mload 0x1c0 add mstore
            // TODO. pick up from here

    0x80 mload 0x200 add 0x80 mstore
    rescale_loop_bottom jump

    rescale_loop_next:
        // our idealized stack: dzz p dzzz <-- from last iteration ->> from current iteration p y x
        // y p dzzz p dzz x
        // dzzz y p dzzz p dzz x
        // dzzz p dzz x
        // x p dzz dzzz
        // dzz dzzz
        // so what's the story here? Our stack state is going to be...
        // dzzz dzz y x p
        // so what do I do with THIS? 
        dup5
        // p dzzz dzz y3 x3 p
        dup2
        // dzzz p dzzz dzz y3 x3 p
        dup5 mulmod
        // y' dzz' dzzz' y3 x3 p
        0x80 mload 0x20 add mstore
        // dzzz dzz y3 x3 p
        dup5 dup3 dup6 mulmod
        // x' dzzz dzz y3 x3 p
        0x80 mload mstore
        // dzzz dzz y3 x3
        swap2 pop
        // dzz dzzz x3
        swap2 pop
        // dzzz dzz

        // dzzz dzz p t3 p p t4 p y x
        // ^^ that is hideous! we need to fix that up
            swap3 mulmod swap4 mulmod swap4 dup5 mulmod 0x80 mload 0x60 add mstore
            swap3 dup4 mulmod 0x80 mload 0x40 add mstore

            swap3 mulmod swap4 mulmod swap4 dup5 mulmod 0x80 mload 0xa0 add mstore
            swap3 dup4 mulmod 0x80 mload 0x80 add mstore

            swap3 mulmod swap4 mulmod swap4 dup5 mulmod 0x80 mload 0xe0 add mstore
            swap3 dup4 mulmod 0x80 mload 0xc0 add mstore
            // P7 vv
            swap3 mulmod swap4 mulmod swap4 dup5 mulmod 0x80 mload 0x120 add mstore
            swap3 dup4 mulmod 0x80 mload 0x100 add mstore
            // P5 vv
            swap3 mulmod swap4 mulmod swap4 dup5 mulmod 0x80 mload 0x160 add mstore
            swap3 dup4 mulmod 0x80 mload 0x140 add mstore
            // P3 vv
            swap3 mulmod swap4 mulmod swap4 dup5 mulmod 0x80 mload 0x1a0 add mstore
            swap3 dup4 mulmod 0x80 mload 0x180 add mstore
            // P1 vv
            swap3 mulmod swap4 mulmod 
            swap4 dup5
            mulmod 0x80 mload 0x1e0 add mstore
            swap3 dup4 mulmod 0x80 mload 0x1c0 add mstore


            0x80 mload 0x200 add 0x80 mstore
    rescale_loop_bottom:
        // I need to find out how many points are still on the stack, somehow
        0x24 calldataload // this gives me the number of points
        0x40 mul          // and this gives the amount of memory a point will take up
        0x08 mul          // and the fact that we have 8 of these points
        0x100 add         // and this adds in the starting offset to my memory table
        0x80 mload        // and this is the memory table
        sub                // if these match then this will be zero
        rescale_loop_next jumpi // and if they don't match then we jump away

    // rescale_loop_end:

        // so what now? we want to return all of these points
        0x24 calldataload 0x08 mul 0xe0 mstore // number of points in our dynamic array
        0x20 0xc0 mstore
        0x24 calldataload 0x40 mul 0x08 mul // mem size of point table
        0x40 add                            // add dynamic array extras
        0xc0
        return

        reject:
        0x00 0x00 revert
        pop pop
        }
    }
}