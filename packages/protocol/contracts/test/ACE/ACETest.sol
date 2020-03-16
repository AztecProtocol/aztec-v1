pragma solidity >=0.5.0 <0.6.0;

import "../../ACE/ACE.sol";

/**
 * @title ACETest
 * @author AZTEC
 *
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
contract ACETest {
    event DebugValidateProofs(bytes proofOutputs);

    ACE public ace;

    function setACEAddress(address _aceAddress) public {
        ace = ACE(_aceAddress);
    }

    function validateProof(
        uint24 _proof,
        address _sender,
        bytes memory _proofData
    ) public returns (bytes memory) {
        bytes memory proofOutputs = ace.validateProof(_proof, _sender, _proofData);
        emit DebugValidateProofs(proofOutputs);
    }
}
