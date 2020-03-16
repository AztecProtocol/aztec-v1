pragma solidity >=0.5.0 <0.6.0;
import "../../../../AccountRegistry/epochs/20200106/Behaviour20200106.sol";

/**
 * Copyright 2020 Spilsbury Holdings Ltd 
 *
 * Licensed under the GNU Lesser General Public Licence, Version 3.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 **/
contract TestAccountMapping is Behaviour20200106 {
    constructor(address _aceAddress, address _trustedGSNSignerAddress) public {
        Behaviour20200106.initialize(_aceAddress, _trustedGSNSignerAddress);
    }
    function setAccountMapping(address _address, bytes memory _linkedPublicKey) public {
        accountMapping[_address] = _linkedPublicKey;
    }

    function setAccountAliasMapping(address _address, address _aliasAddress) public {
        userToAZTECAccountMapping[_address] = _aliasAddress;
    }
}
