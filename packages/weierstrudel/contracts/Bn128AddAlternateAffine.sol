pragma solidity ^0.4.23;

contract Bn128AddAlternateAffineInterface {
    function addPure(uint x1, uint y1, uint x2, uint y2) public pure returns(uint[11]) {}
    function add(uint x1, uint y1, uint x2, uint y2) public returns(uint[11]) {}
}

contract Bn128AddAlternateAffine {

    function() external payable {
        assembly {
        /// @dev mixed point addition
        /// @notice expects (-y1 x1) to be on stack
            0x04 calldataload
            0x24 calldataload
            21888242871839275222246405745257275088696311157297823662689037894645226208583 sub

            0x44 calldataload
            21888242871839275222246405745257275088696311157297823662689037894645226208583
            sub 0x00 mstore
            0x64 calldataload 0x20 mstore
        bn128_add_strauss:
            // 21888242871839275222246405745257275088696311157297823662689037894645226208583
            // dup2 dup1 mulmod

            
            21888242871839275222246405745257275088696311157297823662689037894645226208583
            0x20 mload dup3 add
            // t2 p y x
            0x00 mload dup5 add
            // t1 t2 p y x

            dup3 dup1 dup3 dup1 mulmod
            // t3 p t1 t2 p y x
            dup1 add_affine_skip jumpi
            0x00 0x00 revert
            add_affine_skip:
            dup2 dup2 dup5 mulmod
            // t4 t3 p t1 t2 p y x
            swap4
            // t2 t3 p t1 t4 p y x
            dup3 dup3 dup10 mulmod
            // t5 t2 t3 p t1 t4 p y x
            dup4 sub
            dup4 dup1 dup1 dup5 dup1 mulmod
            // x3 p p t5 t2 t3 p t1 t4 p y x
            dup4 dup1 add add
            dup9 addmod
            // x3 p t5 t2 t3 p t1 t4 p y x
            swap2
            // t5 p x3 t2 t3 p t1 t4 p y x
            dup3 add
            // t5 p x3 t2 t3 p t1 t4 p y x
            dup2 swap4
            // t2 t5 p x3 p t3 p t1 t4 p y x
            mulmod
            // y3 x3 p t3 p t1 t4 p y x
            dup3 dup8 dup11 mulmod
            // t6 y3 x3 p t3 p t1 t4 p y x
            add
            43776485743678550444492811490514550177392622314595647325378075789290452417166 sub
            // -y3 x3 p t3 p t1 t4 p y x
            dup3
            // p y3 x3 p t3 p t1 t4 p y x
            swap6
            // z3 y3 x3 p t3 p p t4 p y x


            0x00 mstore
            0x20 mstore
            0x40 mstore
            0x60 mstore
            0x80 mstore
            0xa0 mstore
            0xc0 mstore
            0xe0 mstore
            0x100 mstore
            0x120 mstore
            0x140 mstore    // z3 y3 x3 p t3 p p t4 p y x
            0x160 0x00 return
    
        reject:
            0x00 0x00 revert
        }
    }
}