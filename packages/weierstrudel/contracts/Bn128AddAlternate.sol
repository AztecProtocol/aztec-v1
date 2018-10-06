pragma solidity ^0.4.23;

contract Bn128AddAlternateInterface {
    function addPure(uint x1, uint y1, uint z1, uint x2, uint y2) public pure returns(uint[11]) {}
    function add(uint x2, uint y2, uint x1, uint y1, uint z1) public returns(uint[11]) {}
}

contract Bn128AddAlternate {

    function() external payable {
        assembly {
        /// @dev mixed point addition
        /// @notice expects (z1 y1 x1) to be on stack
            0x04 calldataload
            0x24 calldataload
            0x44 calldataload

            0x64 calldataload
            21888242871839275222246405745257275088696311157297823662689037894645226208583
            sub 0x00 mstore
            0x84 calldataload 0x20 mstore
        bn128_add_strauss:

            21888242871839275222246405745257275088696311157297823662689037894645226208583
            dup2 dup1 mulmod

            // zz z y x
            21888242871839275222246405745257275088696311157297823662689037894645226208583
            dup1 dup1 dup4 dup6 mulmod
            // zzz p p zz z y x
            0x20 mload mulmod
            // t2 p zz z y x
            dup5 dup3 sub add
            // t2 p zz z y x
            swap2
            // zz p t2 z y x
            0x00 mload mulmod
            // t1 t2 z y x
            dup5 add
            // t1 t2 z y x

            21888242871839275222246405745257275088696311157297823662689037894645226208583
            dup1 dup3 dup1 mulmod
            // t3 p t1 t2 z y x
            dup2 dup2 dup5 mulmod
            // t4 t3 p t1 t2 z y x
            swap4
            // t2 t3 p t1 t4 z y x
            dup3 dup3 dup10 mulmod
            // t5 t2 t3 p t1 t4 z y x
            dup4 sub
            dup4 dup1 dup1 dup5 dup1 mulmod
            // x3 p p t5 t2 t3 p t1 t4 z y x
            dup4 dup1 add add
            dup9 addmod
            // x3 p t5 t2 t3 p t1 t4 z y x
            swap2
            // t5 p x3 t2 t3 p t1 t4 z y x
            dup3 add
            // t5 p x3 t2 t3 p t1 t4 z y x
            dup2 swap4
            // t2 t5 p x3 p t3 p t1 t4 z y x
            mulmod
            // y3 x3 p t3 p t1 t4 z y x
            dup3 dup8 dup11 mulmod
            // t6 y3 x3 p t3 p t1 t4 z y x
            dup4 sub
            add
            // y3 x3 p t3 p t1 t4 z y x
            dup3 dup1
            // p p y3 x3 p t3 p t1 t4 z y x
            swap7
            // t1 p y3 x3 p t3 p p t4 z y x
            dup2
            // p t1 p y3 x3 p t3 p p t4 z y x
            swap10
            // z t1 p y3 x3 p t3 p p t4 p y x
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
            0x100 mstore
            0x120 mstore
            0x140 mstore    // z3 y3 x3 p t3 p p t4 p y x
            0x160 0x00 return
            /*
                                    // z1 y1 x1
            <p>     
            <z1> <z1>               // z1 z1 p z1 y1 x1
            mulmod                  // zz z y x
            <p> <p>                 // p p zz z y x
            <p> <zz> <z>            // z zz p p p zz z y x
            mulmod      
                                    // z3 p p z2 z y x
            <y2> mulmod             // t2 p z2 z y x
            <-y1> add               // t2 p z2 z y x
            <swap t2 z2>            // z2 p t2 z y x
            <x2> mulmod             // t1 t2 z y x
            <x1> add                // t1 t2 z y x

            <p>     
            <p> <t1> <t1>           // t1 t1 p p t1 t2 z y x
            mulmod                  // t3 p t1 t2 z y x
            <p> <p> <t1> <t3>       // t3 t1 p p t3 p t1 t2 z y x
            mulmod                  // t4 p t3 p t1 t2 z y x
            <swap t2> <t4>          // t2 p t3 p t1 t4 z y x
            <p> <p>
            <p> <t2> <t2> mulmod    // x3 p p t2 p t3 p t1 t4 z y x
            <t3> <t3> add add       // x3 p p t2 p t3 p t1 t4 z y x
            <t4> addmod             // x3 p t2 p t3 p t1 t4 z y x
            
            <swap x3 t2>            // t2 p x3 p t3 p t1 t4 z y x
            <x3> <t3> <add>         // y3 t2 p x3 p t3 p t1 t4 z y x
            mulmod                  // y3 x3 p t3 p t1 t4 z y x
            <p> <y1> <t4> mulmod    // t5 y3 x3 p t3 p t1 t4 z y x
            <p> sub
            add                     // y3 x3 p t3 p t1 t4 z y x
            <p> <p>                 // p p y3 x3 p t3 p t1 t4 z y x
            <swap p z>              // z p y3 x3 p t3 p t1 t4 p y x
            <p> <swap p t1>         // t1 z p y3 x3 p t3 p p t4 p y x
            mulmod                  // z3 y3 x3 p t3 p p t4 p y x
            */
    

        }
    }
}