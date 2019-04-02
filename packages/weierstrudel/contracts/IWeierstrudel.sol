pragma solidity >=0.5.0 <0.6.0;

library WeierstrudelStub {}
library MontyStub {}

contract WeierstrudelCaller {

    function ecTest() public view returns (bool) {
        assembly {
            mstore(0x00, 0x01)
            mstore(0x20, 0x02)
            mstore(0x40, keccak256(0x00, 0x40))
            // multiply G by hash of itself, park result in 0x60
            if iszero(staticcall(gas, WeierstrudelStub, 0x00, 0x60, 0x60, 0x60)) {
                revert(0x00, 0x00)
            }
            // normalize point
            if iszero(staticcall(gas, MontyStub, 0x60, 0x60, 0x40, 0x40)) {
                revert(0x00, 0x00)
            }
          
            // compute H(G) and place at at 0x80
            mstore(0x80, keccak256(0x00, 0x40))

            // compute H(G, H(G).G) and place at 0xa0
            mstore(0xa0, keccak256(0x00, 0x80))

            // compute H(G, H(G).G).(H(G).G) + H(G).G and place at 0x00
            if iszero(staticcall(gas, WeierstrudelStub, 0x00, 0xc0, 0x00, 0x60)) {
                revert(0x00, 0x00)
            }
            // normalize point
            if iszero(staticcall(gas, MontyStub, 0x00, 0x60, 0x00, 0x40)) {
                revert(0x00, 0x00)
            }

            // validate we don't have a bunch of zeros
            if iszero(mload(0x00)) {
                revert(0x00, 0x00)
            }
            if iszero(mload(0x20)) {
                revert(0x00, 0x00)
            }

            // now let's try it with precompile
            mstore(0x200, 0x01)
            mstore(0x220, 0x02)
            mstore(0x240, keccak256(0x200, 0x40))

            // put H(G).G at 0x240
            if iszero(staticcall(gas, 0x07, 0x200, 0x60, 0x240, 0x40)) {
                revert(0x00, 0x00)
            }

            // compute H(G, H(G).G)
            mstore(0x280, keccak256(0x200, 0x80))

            // compute H(G, H(G).G).(H(G).G) and place at 0x280
            if iszero(staticcall(gas, 0x07, 0x240, 0x60, 0x280, 0x40)) {
                revert(0x00, 0x00)
            }
            // place H(G, H(G).G).(H(G).G) + H(G).G at 0x40
            if iszero(staticcall(gas, 0x06, 0x240, 0x80, 0x40, 0x40)) {
                revert(0x00, 0x00)
            }

            // now let's compare the precompile point with the Weierstrudel point
            if iszero(eq(mload(0x40), mload(0x00))) {
                revert(0x00, 0x00)
            }
            if iszero(eq(mload(0x60), mload(0x20))) {
                revert(0x00, 0x00)
            }

            // good grief, the bloody thing is working!
            mstore(0x00, 0x01)
            return(0x00, 0x20)
        }
    }
}
