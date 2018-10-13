pragma solidity ^0.4.23;

contract StraussTableSingleAlternateInterface {
    function generateTablePure(uint x, uint y, uint z) public pure returns (uint[59]) {}
}

contract StraussTableSingleAlternate {
    function() external payable {
        assembly {

        strauss_table_single:
            0x220 0x60 mstore   // store dz offset location at 0x40. See, we *do* use a memory pointer!
            
            0x44 calldataload
            0x04 calldataload
            21888242871839275222246405745257275088696311157297823662689037894645226208583
            0x24 calldataload
            dup2

    // stack state: p y p x z
    // Calcualte 2P via 'bn128DoubleStrauss' algorithm. Since we're not consuming z1, y1, x1, we can
    // reduce number of 'swap' opcodes we use
            dup1 dup3 dup1 mulmod dup2 dup2 4 mul
            dup2 dup1 dup3 dup10 mulmod dup2 sub
            dup2 dup10 dup1 mulmod 3 mul
            swap1 dup3 dup3 dup1 mulmod dup2 dup1 add
            add dup1 65664728615517825666739217235771825266088933471893470988067113683935678625749 sub 0x00 mstore
            add mulmod swap3 mulmod dup1 add add 65664728615517825666739217235771825266088933471893470988067113683935678625749 sub 0x20 mstore
            dup1 dup6 dup1 add dup4 mulmod

            // we normalize x and y as if they were scaled by 'zd', without changing 'z'
            // i.e. x' = x(zd^{2}) , y' = y(zd^{3})
            // we can treat xd, yd, zd as an affine point when we calculate 3P, 5P, 7P etc.
            // each point will have a z-coordinate that is (zd) too small, but we can normalize that later
            // stack state: zd p y p x z
            dup1 0x40 mstore
            dup2 dup1 dup3 dup1 mulmod            // zz' p z' p y p x z
            swap6 dup7 mulmod                     // x' z' p y p zz z
            swap5 mulmod mulmod
            21888242871839275222246405745257275088696311157297823662689037894645226208583 sub swap1 swap2       // z -y x

    // stack state z1 y1 x1 (P)
    // Unrolled loop to calculate 3P, 5P, ... , 15P
    // We repeatedly call mixed addition algoritm from 'Bn128AddStrauss', which will add 2P to the last point on the stack
    // Iterations after the 1st replace opcode to push 'p' onto stack with dup opcodes
    // bn128_add_strauss:
            21888242871839275222246405745257275088696311157297823662689037894645226208583
            dup2 dup1 mulmod 21888242871839275222246405745257275088696311157297823662689037894645226208583
            dup1 dup1 dup4 dup6 mulmod
            0x20 mload mulmod dup5 add
            swap2 0x00 mload mulmod
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

    // subsequent addition
    // p3_return: // stack state: z3 y3 x3 p zd^{2} p p zd^{3} p y1 x1
            dup4 dup2 dup1 mulmod dup5 dup1 dup1 dup4 dup6 mulmod 0x20 mload mulmod
            dup5 add swap2 0x00 mload mulmod dup5 add
            dup1 dup6 eq reject jumpi
            dup6 dup1 dup3 dup1 mulmod dup2 dup2 dup5 mulmod swap4
            dup3 dup3 dup10 mulmod dup4 sub dup4 dup1
            dup1 dup5 dup1 mulmod dup4 dup1 add add dup9 addmod swap2
            dup3 add dup2 swap4 mulmod dup3 dup8 dup11 mulmod
            add 43776485743678550444492811490514550177392622314595647325378075789290452417166 sub
            dup3 dup1 swap7 dup2 swap10 mulmod

    // p5_return:
            dup4 dup2 dup1 mulmod dup5 dup1 dup1 dup4 dup6 mulmod 0x20 mload mulmod
            dup5 add swap2 0x00 mload mulmod dup5 add
            dup1 dup6 eq reject jumpi
            dup6 dup1 dup3 dup1 mulmod dup2 dup2 dup5 mulmod swap4
            dup3 dup3 dup10 mulmod dup4 sub dup4 dup1
            dup1 dup5 dup1 mulmod dup4 dup1 add add dup9 addmod swap2
            dup3 add dup2 swap4 mulmod dup3 dup8 dup11 mulmod
            add 43776485743678550444492811490514550177392622314595647325378075789290452417166 sub
            dup3 dup1 swap7 dup2 swap10 mulmod

    // p7_return:
            dup4 dup2 dup1 mulmod dup5 dup1 dup1 dup4 dup6 mulmod 0x20 mload mulmod
            dup5 add swap2 0x00 mload mulmod dup5 add
            dup1 dup6 eq reject jumpi
            dup6 dup1 dup3 dup1 mulmod dup2 dup2 dup5 mulmod swap4
            dup3 dup3 dup10 mulmod dup4 sub dup4 dup1
            dup1 dup5 dup1 mulmod dup4 dup1 add add dup9 addmod swap2
            dup3 add dup2 swap4 mulmod dup3 dup8 dup11 mulmod
            add 43776485743678550444492811490514550177392622314595647325378075789290452417166 sub
            dup3 dup1 swap7 dup2 swap10 mulmod

    // p9_return:
            dup4 dup2 dup1 mulmod dup5 dup1 dup1 dup4 dup6 mulmod 0x20 mload mulmod
            dup5 add swap2 0x00 mload mulmod dup5 add
            dup1 dup6 eq reject jumpi
            dup6 dup1 dup3 dup1 mulmod dup2 dup2 dup5 mulmod swap4
            dup3 dup3 dup10 mulmod dup4 sub dup4 dup1
            dup1 dup5 dup1 mulmod dup4 dup1 add add dup9 addmod swap2
            dup3 add dup2 swap4 mulmod dup3 dup8 dup11 mulmod
            add 43776485743678550444492811490514550177392622314595647325378075789290452417166 sub
            dup3 dup1 swap7 dup2 swap10 mulmod

    // p11_return:
            dup4 dup2 dup1 mulmod dup5 dup1 dup1 dup4 dup6 mulmod 0x20 mload mulmod
            dup5 add swap2 0x00 mload mulmod dup5 add
            dup1 dup6 eq reject jumpi
            dup6 dup1 dup3 dup1 mulmod dup2 dup2 dup5 mulmod swap4
            dup3 dup3 dup10 mulmod dup4 sub dup4 dup1
            dup1 dup5 dup1 mulmod dup4 dup1 add add dup9 addmod swap2
            dup3 add dup2 swap4 mulmod dup3 dup8 dup11 mulmod
            add 43776485743678550444492811490514550177392622314595647325378075789290452417166 sub
            dup3 dup1 swap7 dup2 swap10 mulmod

    // p13_return:
            dup4 dup2 dup1 mulmod dup5 dup1 dup1 dup4 dup6 mulmod 0x20 mload mulmod
            dup5 add swap2 0x00 mload mulmod dup5 add
            dup1 dup6 eq reject jumpi
            dup6 dup1 dup3 dup1 mulmod dup2 dup2 dup5 mulmod swap4
            dup3 dup3 dup10 mulmod dup4 sub dup4 dup1
            dup1 dup5 dup1 mulmod dup4 dup1 add add dup9 addmod swap2
            dup3 add dup2 swap4 mulmod dup3 dup8 dup11 mulmod
            add 43776485743678550444492811490514550177392622314595647325378075789290452417166 sub
            dup3 dup1 dup1 swap8 dup2 swap11 mulmod
    // p15_return:
    // scale final z-coordinate by 'zd', stored at 0x40
    0x40 mload
    mulmod
// z3 y3 x3 p t3 p p t4 p y x
    0x00 mstore
    0x20 mstore
    0x40 mstore
    0x60 mstore
    0x80 mstore
    0xa0 mstore
    0xc0 mstore
    0xe0 mstore
    0x100 mstore // y x p t3 p p t4 p y x

    // 13
    0x120 mstore
    0x140 mstore
    0x160 mstore
    0x180 mstore
    0x1a0 mstore
    0x1c0 mstore
    0x1e0 mstore
    0x200 mstore

    // 11
    0x220 mstore
    0x240 mstore
    0x260 mstore
    0x280 mstore
    0x2a0 mstore
    0x2c0 mstore
    0x2e0 mstore
    0x300 mstore

    // 9
    0x320 mstore
    0x340 mstore
    0x360 mstore
    0x380 mstore
    0x3a0 mstore
    0x3c0 mstore
    0x3e0 mstore
    0x400 mstore

     // 7
    0x420 mstore
    0x440 mstore
    0x460 mstore
    0x480 mstore
    0x4a0 mstore
    0x4c0 mstore
    0x4e0 mstore
    0x500 mstore   

    // 5
    0x520 mstore
    0x540 mstore
    0x560 mstore
    0x580 mstore
    0x5a0 mstore
    0x5c0 mstore
    0x5e0 mstore
    0x600 mstore   

    // 3
    0x620 mstore
    0x640 mstore
    0x660 mstore
    0x680 mstore
    0x6a0 mstore
    0x6c0 mstore
    0x6e0 mstore
    0x700 mstore

    // 1
    0x720 mstore
    0x740 mstore
    
    0x760 0x00 return

    reject:
    0x00 0x00 revert
        }
    }
}