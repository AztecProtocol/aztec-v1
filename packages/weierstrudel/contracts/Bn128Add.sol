pragma solidity ^0.4.23;

contract Bn128AddInterface {
    function addPure(uint x2, uint y2, uint x1, uint y1, uint z1) public pure returns(uint[3]) {}
    function add(uint x2, uint y2, uint x1, uint y1, uint z1) public returns(uint[3]) {}
}

contract Bn128Add {
    function () public payable {
        assembly {
            21888242871839275222246405745257275088696311157297823662689037894645226208583
            calldataload(0x44)
            calldataload(0x64)
            calldataload(0x84)
            dup4            // p z1 y1 x1
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
            calldataload(0x24)  // y2 t2 p p p t1 p z1 y1 x1
            mulmod              // t2 p p t1 p z1 y1 x1
            dup7 dup3 sub       // -y1 t2 p p t1 p z1 y1 x1
            // NOTE: Is y1 not overloaded? I think it is?
            add                 // t2 p p t1 p z1 y1 x1
            swap3               // t1 p p t2
            calldataload(0x04)   // x2 t1 p p t2
            dup3 sub            // -x2 t1 p p t2 z1 y1 x1
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
            add                     // y3 z3 x3
            swap1                   // z3 y3 x3 p

            // y3 is 2x overloaded
            0x40 mstore
            0x20 mstore
            0x00 mstore
            0x60 0x00 return
            pop
        }

    }

}