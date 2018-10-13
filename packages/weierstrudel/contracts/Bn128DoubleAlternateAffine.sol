pragma solidity ^0.4.23;

contract Bn128DoubleAlternateAffineInterface {
    function doublePure(uint x, uint y) public pure returns(uint[5]) {}
    function double(uint x, uint y) public returns(uint[5]) {}
}

contract Bn128DoubleAlternateAffine {
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


            0x04 calldataload
            0x24 calldataload

            // stack state: y x p
            21888242871839275222246405745257275088696311157297823662689037894645226208583 dup2 dup1 mulmod
            // stack state: t1 y x
            21888242871839275222246405745257275088696311157297823662689037894645226208583 dup2 4 mul
            // stack state: t2 p t1 y x p (t2 = 4x overloaded)
            dup2 dup1 dup1
            // stack state: p p p t2 p t1 y x p
            dup4 dup9
            // stack state: x t2 p p p t2 p t1 y x p
            mulmod
            // stack state: zzx p p t2 p t1 y x
            swap7
            // stack state: x p p t2 p t1 y zzx
            dup1 mulmod
            // stack state: x^2 p t2 p t1 y zzx
            3 mul
            // stack state: t4 p t2 p t1 y zzx (t4 = 3x overloaded)
            dup2 dup2 dup1
            // stack state: t4 t4 p t4 p t2 p t1 y zzx
            mulmod
            // stack state: (t4^2) t4 p t2 p t1 y zzx
            dup8 dup4 sub dup1 add
            // stack state: 2t3 (t4^2) t4 p t2 p t1 y zzx
            add
            // stack state: x3 t4 p t2 p t1 y t3 (x3 = 3x overloaded)
            65664728615517825666739217235771825266088933471893470988067113683935678625749 sub
            dup1 0x00 mstore
            // stack state: -x3 t4 p t2 p t1 y zzx p (x3 = 3x overloaded)
            dup8 add
            // stack state: (t3-x3) t4 p t2 p t1 y zzx (x3 = 3x overloaded)
            mulmod
            // stack state: y3' t2 p t1 z y zzx (x3 = 3x overloaded)
            swap3 mulmod
            21888242871839275222246405745257275088696311157297823662689037894645226208583 sub
            dup1 add
            // stack state: zzzy y3' y zzx (x3 = 3x overloaded)
            swap2
            // stack state: y y3' zzzy zzx
            dup1 add
            // stack state: z3 y3' zzzy zzx
            0x40 mstore
            // stack state: y3' zzzy zzx
            dup2 add
            // stack state: y3 zzzy zzx
            0x20 mstore
            // stack state:  zzzzy zzx
            0x80 mstore
            0x60 mstore

            0xa0 0x00 return
        }
    }
}