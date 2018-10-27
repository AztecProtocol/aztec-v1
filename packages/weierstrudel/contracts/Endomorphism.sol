pragma solidity ^0.4.23;


contract EndomorphismInterface {

}

contract Endomorphism {
// function getEndomorphismOptimized() {
//     assembly {
//         // I think this part gets us f_a??
//         0x2CF24DBA5FB0A30E26E83B2AC5B9E29E1B161E5C1FA7425E73043362938B9824

//         0
//         not
//         dup3
//         0x3086d221a7d46bcde86c90e49284eb153dab
//         mulmod
//         dup2
//         0x3086d221a7d46bcde86c90e49284eb153dab
//         mul
//         dup1
//         dup3
//         lt
//         swap2
//         sub
//         sub

//         0
//         not
//         dup4
//         0xe4437ed6010e88286f547fa90abfe4c42212
//         mulmod
//         dup3
//         0xe4437ed6010e88286f547fa90abfe4c42212
//         mul
//         dup1
//         dup3
//         lt
//         swap2
//         sub
//         sub
//     }
// }

// g1 = -0x24ccef014a773d2cf7a7bd9d4391eb18d
// g2 = 0x2d91d232ec7e0b3d7
// b1 = -0x6f4d8248eeb859fc8211bbeb7d4f1128
// b2 = 89d3256894d213e3

// 39 * 3 = 117
// 32 + 16 = 48
// 10
// 175 gas to split k

    /// @dev Calculate scalar decompsition of k via Babai rounding
    // n = order of group G
    // We want to split k into two short scalars: k1 and k2
    // where k1 - k2 * lambda = k.
    // lambda = cube root of unity modulo n (see GLV decomposition)

    // We have calculated basis scalars b0 and b1.

    function splitKAsm(uint) public view returns (bytes32[2]) {
        assembly {
            0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001 dup1
            0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
            0x24ccef014a773d2cf7a7bd9d4391eb18d 0x04 calldataload mulmod // mm
            0x24ccef014a773d2cf7a7bd9d4391eb18d 0x04 calldataload mul    // bottom mm
            dup1 dup3 lt // x bottom mm
            swap2 sub sub // c2 n n
            0x89d3256894d213e3 mulmod // q2 n

            dup2
            0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
            0x2d91d232ec7e0b3d7 0x04 calldataload mulmod // mm
            0x2d91d232ec7e0b3d7 0x04 calldataload mul    // bottom mm
            dup1 dup3 lt // x bottom mm
            swap2 sub sub // c1 n n
            0x30644e72e131a029b85045b68181585cb8e665ff8b011694c1d039a872b0eed9 mulmod // q1 q2 n
            addmod                    // k2
            0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001 dup1
            dup3 0xb3c4d79d41a917585bfc41088d8daaa78b17ea66b99c90dd mulmod // lk2 n k2
            0x04 calldataload addmod  // k1 k2
            0x00 mstore
            0x20 mstore
            0x40 0x00 return

            // <n> <n>
            // <-1> <g1> <k> mulmod
            // <g1> <k> mul
            //             // bottom mm n n
            // <dup bottom> <dup mm> lt
            //             // x bottom mm n n
            // <swap x mm>
            //             // mm bottom x n n
            // sub sub     // c1 n n
            // <minus b1> mulmod
            //             // q1 n

            // <n>
            // <-1> <g2> <k> mulmod
            // <g2> <k> mul
            //             // bottom mm
            // <dup bottom> <dup mm> lt
            //             // x bottom mm
            // <swap x mm>
            //             // mm bottom x
            // sub sub     // c2 n q1 n
            // <b2> mulmod
            //             // q2 q1 n
            // <addmod>    // k1
            // <n> <n> <dup k1> <lambda>
            //             // lambda k1 n n k1
            // mulmod
            //             // lk1 n k1
            // <k> addmod  // k2 k1
        }
    }

    function getEndomorphism(uint k) public view returns (bytes32 k1, bytes32 k2) {
        assembly {
            // n = order of group G
            let n := 21888242871839275222246405745257275088548364400416034343698204186575808495617
            // labmda = cube root of unity modulo n
            let lambda := 0xb3c4d79d41a917585bfc41088d8daaa78b17ea66b99c90dd

            // b1 = first short basis vector. b1 is a negative number which we represent modulo n
            let b1 := 0x30644e72e131a029b85045b68181585cb8e665ff8b011694c1d039a872b0eed9
            // b2 = second short basis vector
            let b2 := 0x89d3256894d213e3
            let mm := mulmod(k, 0x24ccef014a773d2cf7a7bd9d4391eb18d, not(0)) // minus_g1
            let bottom := mul(k, 0x24ccef014a773d2cf7a7bd9d4391eb18d)
            let minus_c2_top := sub(sub(mm, bottom), lt(mm, bottom))
            mm := mulmod(k, 0x2d91d232ec7e0b3d7, not(0))                // g2
            bottom := mul(k, 0x2d91d232ec7e0b3d7)
            let c1_top := sub(sub(mm, bottom), lt(mm, bottom))

            let q1 := mulmod(c1_top, b1, n)
            let q2 := mulmod(minus_c2_top, b2, n)
            
            k2 := addmod(q2, q1, n)
            k1 := addmod(k, mulmod(k2, lambda, n), n)
            // k1 := minus_q1
            // k2 := q2
            // k1 := sub(minus_q1, q2)
            // k2 := sub(mulmod(k1, lambda, n), k)
        }
    }
}
0x3086d221a7d46bcde86c90e49284eb15
0x114ca50f7a8e2f3f657c1108d9d44cfd8