pragma solidity ^0.4.23;

contract Bn128EndomorphismInterface {
    function calculateEndomorphismPure(uint s) public pure returns(uint) {}
    function calculateEndomorphism(uint s) public returns(uint[3]) {}
}

// this uses secp256k1 endomorphism. Need to swap out
contract Bn128Endomorphism {
    function() {
        assembly {
            let u := calldataload(0x04)
            let p := 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
            let mm := mulmod(u, 0x3086d221a7d46bcde86c90e49284eb153dab, not(0))
            let bottom := mul(u, 0x3086d221a7d46bcde86c90e49284eb153dab)
            let f_a := sub(sub(mm, bottom), lt(mm, bottom))
            mm := mulmod(u, 0xe4437ed6010e88286f547fa90abfe4c42212, not(0))
            bottom := mul(u, 0xe4437ed6010e88286f547fa90abfe4c42212)
            let f_b := sub(sub(mm, bottom), lt(mm, bottom))
            let r1 := addmod(
                mulmod(
                        div(
                            f_a,
                            65536
                        ),
                        0xe4437ed6010e88286f547fa90abfe4c3,
                        p
                ),
                mulmod(
                    div(
                        f_b,
                        65536
                    ),
                    0xfffffffffffffffffffffffffffffffe8a280ac50774346dd765cda83db1562c,
                    p
                ), p
            )
            let r2 := addmod(mulmod(
                r1,
                0xac9c52b33fa3cf1f5ad9e3fd77ed9ba4a880b9fc8ec739c2e0cfc810b51283cf,
                p
            ), u, p)
            
            mstore(0x00, r1)
            mstore(0x20, r2)
            return(0x00, 0x40)
        }
    }
}