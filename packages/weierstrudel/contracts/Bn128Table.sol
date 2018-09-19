pragma solidity ^0.4.23;

contract Bn128TableInterface {
    function tablePure(uint x, uint y, uint z) public pure returns(uint[3]) {}
    function table(uint x, uint y, uint z) public returns(uint[3]) {}
}

// Hmmmmmmm how do we want to do this?

// 1: table with 1 point
// 2: table with 2 points
// 3: table with 3 points
// 4: table with n points

// Or. Take premature optimization to be the root of all evil
// and suck up the inefficiencies and do a generic table<n>
// without keeping everything on the stack!
contract Bn128Table {
    function () public payable {
        assembly {
            // calldata map
            // 0x04 - 0x24: location of point array in calldata (0x20)
            // 0x24 - 0x44: size of point array
            // 0x44 - ????: point array
            generate_table_multiple_points:

            generate_table:
                // stack state = z y x
                
                21888242871839275222246405745257275088696311157297823662689037894645226208583
                dup4 dup4 dup4 generate_table_double_return ecc_double jump
                generate_table_double_return: // dz dy dx p x y z

                dup1 dup1
                21888242871839275222246405745257275088696311157297823662689037894645226208583
                mulmod                      // dz2 dz dy dx p x y z
                21888242871839275222246405745257275088696311157297823662689037894645226208583
                dup2 dup8                   // x dz2 p dz2 dz dy dx p x y z
                mulmod                      // x' dz2 dz dy dx p x y z
                swap6 pop                   // todo optimize this out
                21888242871839275222246405745257275088696311157297823662689037894645226208583
                swap2
                mulmod                      // dz3 dy dx p x' y z
                21888242871839275222246405745257275088696311157297823662689037894645226208583
                swap1 dup7                  // y dz3 p dy dx p x' y z
                mulmod                      // y' dy dx p x' y z
                swap5 pop                   // todo optimize out
                                            // dy dx p x' y' z
            ecc_double:
                0x00 mstore
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
                mulmod  // z3 y3 x3 p
                0x00 mload jump

        }
    }
}