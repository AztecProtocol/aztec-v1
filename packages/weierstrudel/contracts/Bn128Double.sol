pragma solidity ^0.4.23;

contract Bn128DoubleInterface {
    function doublePure(uint x, uint y, uint z) public pure returns(uint[3]) {}
    function double(uint x, uint y, uint z) public returns(uint[3]) {}
}

contract Bn128Double {
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
            21888242871839275222246405745257275088696311157297823662689037894645226208583

            0x04 calldataload
            0x24 calldataload
            0x44 calldataload

            // stack state: z y x p
            dup4 dup3 dup1// stack state: y y p z y x p
            mulmod
            // stack state: t1 z y x p
            dup5 dup2
            // stack state: t1 p t1 z y x p
            4 mul
            // stack state: t2 p t1 z y x p (t2 = 4x overloaded)
            dup7 dup1 dup1
            // stack state: p p p t2 p t1 z y x p
            dup4 dup10
            // stack state: x t2 p p p t2 p t1 z y x p
            mulmod
            // stack state: (x.t2) p p t2 p t1 z y x p
            dup10
            sub

            // stack state: t3 p p t2 p t1 z y x p
            swap8
            // stack state: x p p t2 p t1 z y t3 p
            dup1 mulmod
            // stack state: x^2 p t2 p t1 z y t3 p
            3 mul
            // stack state: t4 p t2 p t1 z y t3 p (t4 = 3x overloaded)
            dup9 dup2 dup1
            // stack state: t4 t4 p t4 p t2 p t1 z y t3 p
            mulmod
            // stack state: (t4^2) t4 p t2 p t1 z y t3 p
            dup9 dup1 add
            // stack state: 2t3 (t4^2) t4 p t2 p t1 z y t3 p
            add
            // stack state: x3 t4 p t2 p t1 z y t3 p (x3 = 3x overloaded)

            swap8
            // stack state: t3 t4 p t2 p t1 z y x3 p
            dup9 add
            // stack state: (x3+t3) t4 p t2 p t1 z y x3 p (x3+t3 = 4x overloaded)
            mulmod
            // stack state: y3' t2 p t1 z y x3 p
            swap3
            // stack state: t1 t2 p y3' z y x3 p
            mulmod
            // stack state: t1 y3' z y x3 p
            dup1 add
            // stack state: 2t1 y3' z y x3 p
            add
            // stack state: -y3 z y x3 p
            // we need to negate (-y3), which is 3x overloaded, so subtract from 3p
            65664728615517825666739217235771825266088933471893470988067113683935678625749
            sub
            // stack state: y3 z y x3 p
            swap2
            // stack state: y z y3 x3 p
            dup5
            // stack state: p y z y3 x3 p
            swap2
            // stack state: z y p y3 x3 p
            dup1 add
            // stack state: 2z y p y3 x3 p
            mulmod
            // stack state: z3 y3 x3 p
            // Tadaaa

            // 37 low (111)
            // 7 high (56)
            // 2 mid (10)
            // 177 gas? eh not so bad
            0x40 mstore
            0x20 mstore
            0x00 mstore
            0x60 0x00 return
            pop
        }
    }
}