pragma solidity >=0.5.0 <0.6.0;

import "../20200207/Behaviour20200207.sol";
import "../../../interfaces/IERC20Permit.sol";

/**
 * @title Behaviour20200220 implementation
 * @author AZTEC
 * @dev This behaviour contract overloads the deposit() account registry method, with a deposit() 
 * implementation that is compatible with the DAI permit() function.
 * 
 * Note the behaviour contract version naming convention is based on the date on which the contract
 * was created, in the format: YYYYMMDD
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
contract Behaviour20200220 is Behaviour20200207 {
    /**
    * @dev epoch number, used for version control in upgradeability. The naming convention is based on the
    * date on which the contract was created, in the format: YYYYMMDD
    */
    uint256 public epoch = 20200220;

    event ContractAddress(address variable);

    /**
    * @dev This deposit() implementation performs the standard AccountRegistry deposit functionality, but it
    * is also specifically compatible with the DAI permit() function. 
    
    * The permit() function removes the need for a user to send a seperate approval() transaction
    * beforehand in order to approve another address to spend DAI on their behalf. 
    * 
    * @param _registryOwner - owner of the zkAsset
    * @param _owner - owner of the ERC20s being deposited
    * @param _proofHash - hash of the zero-knowledge deposit proof
    * @param _proofData - cryptographic data associated with the zero-knowledge proof
    * @param _value - number of ERC20s being deposited
     */
    function deposit(
        address _registryOwner,
        address _owner,
        bytes32 _proofHash,
        bytes memory _proofData,
        uint256 _value,
        bytes memory signature,
        uint256 nonce     
    ) public {
        emit ContractAddress(address(this));
        bytes memory proofOutputs = ace.validateProof(
            JOIN_SPLIT_PROOF,
            address(this),
            _proofData
        );


        if (_owner != _msgSender()) {
            require(
                userToAZTECAccountMapping[_owner] == _msgSender(),
                "Sender has no permission to deposit on owner's behalf."
            );

            (,
            bytes memory proofOutputNotes,
            ,
            ) = proofOutputs.get(0).extractProofOutput();
            uint256 numberOfNotes = proofOutputNotes.getLength();
            for (uint256 i = 0; i < numberOfNotes; i += 1) {
                (address owner,,) = proofOutputNotes.get(i).extractNote();
                require(owner == _owner, "Cannot deposit note to other account if sender is not the same as owner.");
            }
        }

        (address linkedTokenAddress,,,,,,,) = ace.getRegistry(_registryOwner);
        IERC20Permit linkedToken = IERC20Permit(linkedTokenAddress);

        permit(linkedTokenAddress, _owner, nonce, signature);

        linkedToken.transferFrom(
            _owner,
            address(this),
            _value
        );

        linkedToken.approve(address(ace), _value);

        ace.publicApprove(_registryOwner, _proofHash, _value);

        IZkAsset(_registryOwner).confidentialTransferFrom(
            JOIN_SPLIT_PROOF,
            proofOutputs.get(0)
        );
    }

    /**
    * @dev Call linkedToken.permit(), to grant an address approval to spend linkedToken tokens
    * on holder's behalf. Makes use of the new DAI permit() method
    *
    * @param linkedTokenAddress - address of the linkedToken
    * @param holder - owner of the ERC20 tokens, which are being approved to be spent by the spender
    * @param signature - signature required for permit function
    */
    function permit(address linkedTokenAddress, address holder, uint256 nonce, bytes memory signature) public {
        bool allowed = true;
        uint256 expiry = uint256(-1);
        address spender = address(this);

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := mload(add(signature, 0x41))
        }

        IERC20Permit(linkedTokenAddress).permit(holder, spender, nonce, expiry, allowed, v, r, s);
    }
}

