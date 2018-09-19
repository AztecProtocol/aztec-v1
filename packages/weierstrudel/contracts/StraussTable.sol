pragma solidity ^0.4.23;

contract StraussTable {

    function() external {
        assembly {

        strauss_table_single:
            calldataload(0x04)
            calldataload(0x24)
            calldataload(0x44)
            // stack state: z y x

            dup3 dup3 dup3 
            // stack state: z3 y3 x3 z y x

            //bn128_dbl_strauss:
            // stack state: z y x
            21888242871839275222246405745257275088696311157297823662689037894645226208583
            dup3 dup1// stack state: y y p z y x
            mulmod
            // stack state: t1 z y x
            21888242871839275222246405745257275088696311157297823662689037894645226208583
            dup2
            // stack state: t1 p t1 z y x
            4 mul
            // stack state: t2 p t1 z y x (t2 = 4x overloaded)
            dup2 dup1 dup1
            // stack state: p p p t2 p t1 z y x
            dup4 dup2
            // stack state: x t2 p p p t2 p t1 z y x
            mulmod
            // stack state: (x.t2) p p t2 p t1 z y x
            dup2
            sub

            // stack state: t3 p p t2 p t1 z y x
            swap8
            // stack state: x p p t2 p t1 z y t3
            dup1 mulmod
            // stack state: x^2 p t2 p t1 z y t3
            3 mul
            // stack state: t4 p t2 p t1 z y t3 (t4 = 3x overloaded)
            dup2 dup2 dup1
            // stack state: t4 t4 p t4 p t2 p t1 z y t3
            mulmod
            // stack state: (t4^2) t4 p t2 p t1 z y t3
            dup9 dup1 add
            // stack state: 2t3 (t4^2) t4 p t2 p t1 z y t3
            add
            // stack state: x3 t4 p t2 p t1 z y t3 (x3 = 3x overloaded)

            swap8
            // stack state: t3 t4 p t2 p t1 z y x3
            dup9 add
            // stack state: (x3+t3) t4 p t2 p t1 z y x3 (x3+t3 = 4x overloaded)
            mulmod
            // stack state: y3' t2 p t1 z y x3
            swap3
            // stack state: t1 t2 p y3' z y x3
            mulmod
            // stack state: t1 y3' z y x3
            dup1 add
            // stack state: 2t1 y3' z y x3
            add
            // stack state: -y3 z y x3
            // we need to negate (-y3), which is 3x overloaded, so subtract from 3p
            65664728615517825666739217235771825266088933471893470988067113683935678625749
            sub
            // stack state: y3 z y x3
            swap2
            // stack state: y z y3 x3
            21888242871839275222246405745257275088696311157297823662689037894645226208583
            // stack state: p y z y3 x3
            swap2
            // stack state: z y p y3 x3
            dup1 add
            // stack state: 2z y p y3 x3
            mulmod
            // stack state: z3 y3 x3


            // we now have zd yd xd z1 y1 x1 (2P 1P) on the stack
            // we want to calculate 3P, 5P, 7P ... etc, by adding 2P to an accumulator
            // if we scale 1P's x and y coordinates by zd then we can tread zd yd as affine
            // and only re-scale the z'coord of the last point (the one we use)
            21888242871839275222246405745257275088696311157297823662689037894645226208583
            dup1    // p p zd yd xd z1 y1 x1
            dup3    // zd p p zd yd xd z1 y1 x1
            dup1    // zd z3 p p zd yd xd z1 y1 x1
            mulmod  // zd^2 p zd yd xd z1 y1 x1
            dup2    // p zd^2 p zd yd xd z1 y1 x1
            dup4    // zd p zd^2 p zd yd xd z1 y1 x1
            dup3    // zd^2 zd p zd^2 p zd yd xd z1 y1 x1
            mulmod  // zd^3 zd^2 p zd yd xd z1 y1 x1
            swap9   // x1 zd^2 p zd yd xd z1 y1 zd^3
            mulmod  // x' zd yd xd z1 y1 zd^3
            swap6   // zd^3 zd yd xd z1 y1 x'
            21888242871839275222246405745257275088696311157297823662689037894645226208583
                    // p zd^3 zd yd xd z1 y1 x'
            swap2   // zd zd^3 p yd xd z1 y1 x'
            swap6   // y1 zd^3 p yd xd z1 zd x'
            mulmod  // y' yd xd z1 zd x'
            swap4   // zd yd xd z1 y' x'
            0x40 mstore // yd xd z1 y' x'
            0x00 mstore
            65664728615517825666739217235771825266088933471893470988067113683935678625749
            sub     // we store -xd to save a sub instruction in our mixed addition algorithm
                    // subtract 3P because x3 is 3x overloaded
            0x20 mstore
            // stack state: z1 y1 x1
            // we now want to add P and 2P, without overwriting  P
            // TODO: write a more optimized algo instead of re-using mixed add!
            // TODO: use hardcoded algo instead of jumping to save some gas
            dup3 dup3       // y1 x1 z1 y1 x1
            p3_return       // [tag] y1 x1 z1 y1 x1
            swap3           // z1 y1 x1 [tag] y1 x1 // we don't need to store z, consume it
            // stack state: z1 y1 x1 [tag] z1 y1 x1
            bn128_add_strauss jump
        
        p3_return:      // x3 y3 z3 y1 x1
            swap2       // z3 y3 x3 y1 x1
            dup3 dup3   // y3 x3 z3 y3 x3 y1 x1
            p5_return swap3 // z3 y3 x3 [tag] y3 x3 y1 x1
            bn128_add_strauss jump
    
        p5_return:      // x3 y3 z3 y1 x1
            swap2       // z3 y3 x3 y1 x1
            dup3 dup3   // y3 x3 z3 y3 x3 y1 x1
            p7_return swap3 // z3 y3 x3 [tag] y3 x3 y1 x1
            bn128_add_strauss jump
    
        p7_return:      // x3 y3 z3 y1 x1
            swap2       // z3 y3 x3 y1 x1
            dup3 dup3   // y3 x3 z3 y3 x3 y1 x1
            p9_return swap3 // z3 y3 x3 [tag] y3 x3 y1 x1
            bn128_add_strauss jump
    
        p9_return:      // x3 y3 z3 y1 x1
            swap2       // z3 y3 x3 y1 x1
            dup3 dup3   // y3 x3 z3 y3 x3 y1 x1
            p11_return swap3 // z3 y3 x3 [tag] y3 x3 y1 x1
            bn128_add_strauss jump

    
        p11_return:      // x3 y3 z3 y1 x1
            swap2       // z3 y3 x3 y1 x1
            dup3 dup3   // y3 x3 z3 y3 x3 y1 x1
            p13_return swap3 // z3 y3 x3 [tag] y3 x3 y1 x1
            bn128_add_strauss jump
    
        p13_return:      // x3 y3 z3 y1 x1
            swap2       // z3 y3 x3 y1 x1
            dup3 dup3   // y3 x3 z3 y3 x3 y1 x1
            p15_return swap3 // z3 y3 x3 [tag] y3 x3 y1 x1
            bn128_add_strauss jump
    
        p15_return:      // x3 y3 z3 y1 x1
            swap2       // zf yf xf ...
            // zf is off by a factor of zd, scale up
            21888242871839275222246405745257275088696311157297823662689037894645226208583
            swap1
            0x40 mload
            mulmod      // zf' yf xf ... 


        // question: we aren't storing zr yet. This is more than enough to test though!

        // return data: 8 points = 16 words + zf = 17
        0x0 mstore
        0x20 mstore
        0x40 mstore
        0x60 mstore
        0x80 mstore
        0xa0 mstore
        0xc0 mstore
        0xe0 mstore
        0x100 mstore
        0x120 mstore
        0x140 mstore
        0x160 mstore
        0x180 mstore
        0x1a0 mstore
        0x1c0 mstore
        0x1e0 mstore
        0x200 mstore
        0x220 0x00 return
        pop pop pop pop pop pop // wat...

        /// @dev mixed point addition
        /// @notice expects (z1 y1 x1) to be on stack
        bn128_add_strauss:

            21888242871839275222246405745257275088696311157297823662689037894645226208583
                            // p z1 y1 x1
            dup1            // p p z1 y1 x1
            dup3            // z1 p p z1 y1 x1
            dup1            // z1 z1 p p z1 y1 x1
            mulmod          // t1 p z1 y1 x1
            dup2            // p t1 p z1 y1 x1
            dup1
            dup1
            dup1                // p p p p t1 p z1 y1 x1
            dup7                // z1 p p p p t1 p z1 y1 x1
            dup6                // t1 z1 p p p p t1 p z1 y1 x1
            mulmod              // t2 p p p t1 p z1 y1 x1
            0x00 mload          // y2 t2 p p p t1 p z1 y1 x1
            mulmod              // t2 p p t1 p z1 y1 x1
            dup7
            65664728615517825666739217235771825266088933471893470988067113683935678625749
            sub                 // y1 is 3x overloaded (both from dbl and add). So subtract 3p to negate
                                // -y1 t2 p p t1 p z1 y1 x1
            // NOTE: Is y1 not overloaded? I think it is?
            add                 // t2 p p t1 p z1 y1 x1
                                // t2 is 4x overloaded! any opcode involving t2 must be modular
            swap3               // t1 p p t2
            0x20 mload          // x2 t1 p p t2
            // dup3 sub            // -x2 t1 p p t2 z1 y1 x1
            mulmod              // t1 p t2 p z1 y1 x1

            dup7
            add                     // t1 p t2 p z1 y1 x1
            dup2 dup1 dup1          // p p p t1 p t2 p z1 y1 x1
            dup4 dup1               // t1 t1 p p p t1 p t2 p z1 y1 x1
            mulmod                  // t3 p p t1 p t2 p z1 y1 x1
            dup2 dup5 dup3          // t3 t1 p t3 p p t1 p t2 p z1 y1 x1
            mulmod                  // t4 t3 p p t1 p t2 p z1 y1 x1
            swap10                  // x1 t3 p p t1 p t2 p z1 y1 t4
            mulmod                  // t3 p t1 p t2 p z1 y1 t4
            dup2 sub                // t3 p t1 p t2 p z1 y1 t4
            swap7                   // y1 p t1 p t2 p z1 t3 t4
            dup2 dup10              // t4 p y1 p t1 p t2 p z1 t3 t4
            dup2 dup8 dup1          // t2 t2 p t4 p y1 p t1 p t2 p z1 t3 t4
            mulmod                  // x3 t4 p y1 p t1 p t2 p z1 t3 t4

            dup11 dup1 add
            add
            addmod                  // x3 y1 p t1 p t2 p z1 t3 t4
            swap9                   // t4 y1 p t1 p t2 p z1 t3 x3
            mulmod                  // t4 t1 p t2 p z1 t3 x3
            dup3 sub                // t4 t1 p t2 p z1 t3 x3
            swap5                   // z1 t1 p t2 p t4 t3 x3
            mulmod                  // z3 t2 p t4 t3 x3
            swap4                   // t3 t2 p t4 z3 x3
            dup6                    // x3 t3 t2 p t4 z3 x3
            add                     // t3 t2 p t4 z3 x3
            mulmod                  // t3 t4 z3 x3
            add                     // y3 z3 x3 [tag]
            swap1                   // z3 y3 x3 [tag]
            swap3 jump              // y3 x3 z3
        }
    }
}