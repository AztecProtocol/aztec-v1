pragma solidity ^0.4.23;

contract Bn128DoubleAlternateInterface {
    function doublePure(uint x, uint y, uint z) public pure returns(uint[3]) {}
    function double(uint x, uint y, uint z) public returns(uint[3]) {}
}

contract Bn128DoubleAlternate {
    function () public payable {
        assembly {
            // phew, this is going to be fun.

            // Elliptic cuve point doubling. We make heavy use of the 'mulmod' opcode to perform
            // field multiplications modlulo the prime field scalar. Without it we'd need to do long-form
            // 512-bit multiplication or a Montgomery reduction. The EVM already does the former under the hood,
            // hence the comparative cheapness of 'mulmod'.

            // Point doubling formula:

            // X3 = 9(X^4) - 8X(Y^2)
            // Y3 = -3(X^2)(X3 - 4X(Y^2)) + 8(Y^4)
            // Z3 = 2YZ

            // N.B. The bn128 curve's prime field is 254-bits, *not* 256 bits. It is possible to fit
            // 4 * the prime field scalar into a single evm machine word.
            // This means that we can calculate up to 4 additions, or multiplication by 4 (or a combination of both)
            // before having to take the modulus of the result.
            // We take advantage of the implicit modlulus operation in 'mulmod' to do this after combining
            // additions && multiplicaton by small constants

            /* 0x04 calldataload
            0x24 calldataload
            0x44 calldataload */
            0x44 calldataload
            0x04 calldataload
            21888242871839275222246405745257275088696311157297823662689037894645226208583
            0x24 calldataload
            dup2
            // from         z y x
            // to           p y p x z
            // mappings
            // z -> +4
            // y -> 0
            // x -> +1
            // stack state: p y p x z
            dup1
            dup3 dup1// stack state: y y p p z y x p
            mulmod
            // stack state: t1 p y p x z
            dup2 dup2
            // stack state: t1 p t1 p y p x z
            4 mul
            // stack state: t2 p t1 p y p x z
            dup2 dup1
            // stack state: p p t2 p t1 p y p x z
            dup3 dup10
            // stack state: x t2 p p t2 p t1 p y p x z
            mulmod
            // stack state: (x.t2) p t2 p t1 p y p x z
            dup2
            sub
            // stack state: t3 p t2 p t1 p y p x z
            dup2 dup10 dup1 mulmod 3 mul
            // stack state: t4 t3 p t2 p t1 p y p x z
            swap1
            // stack state: t3 t4 p t2 p t1 p y p x z
            dup3 dup3 dup1 mulmod
            // stack state: t4^2 t3 t4 p t2 p t1 p y p x z
            dup2 dup1 add
            // stack state: 2t3 t4^2 t3 t4 p t2 p t1 p y p x z
            add
            // stack state: x3 t3 t4 p t2 p t1 p y p x z
            dup1 65664728615517825666739217235771825266088933471893470988067113683935678625749 sub
            0x00 mstore // (storing -x3)
            // stack state: x3 t3 t4 p t2 p t1 p y p x z
            add
            // stack state: (x3 + t3) t4 p t2 p t1 p y p x z
            mulmod
            // stack state: y3' t2 p t1 p y p x z
            swap3
            // stack state: t1 t2 p y3' p y p x z
            mulmod
            // stack state: t1 y3' p y p x z
            dup1 add
            // stack state: 2t1 y3' p y p x z
            add
            // stack state: y3 p y p x z
            65664728615517825666739217235771825266088933471893470988067113683935678625749 sub
            0x20 mstore // (storing y3)
            // stack state: p y p x z
            dup1 dup6 dup1 add
            // stack state: 2z p p y p x z
            dup4 mulmod
            // stack state z3 p y p x z
            0x40 mstore
            pop pop pop pop pop

            0x60 0x00 return
        }
    }
}