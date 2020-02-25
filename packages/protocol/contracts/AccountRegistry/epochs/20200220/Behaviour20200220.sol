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
    * @param signature - EIP712 signature supplied to permit() for granting approval
    * @param nonce - permit nonce used for signature replay protection
    * @param expiry - unix timestamp up to which the permit is valid
     */
    function deposit(
        address _registryOwner,
        address _owner,
        bytes32 _proofHash,
        bytes memory _proofData,
        uint256 _value,
        bytes memory signature,
        uint256 nonce,
        uint256 expiry     
    ) public {
        (address linkedTokenAddress,,,,,,,) = ace.getRegistry(_registryOwner);        

        // default params for deposit permit() call
        bool allowed = true;
        address spender = address(this);
        permit(linkedTokenAddress, _owner, nonce, allowed, expiry, spender, signature);

        super.deposit(_registryOwner, _owner, _proofHash, _proofData, _value);
    }

    /**
    * @dev Call linkedToken.permit(), to grant an address approval to spend linkedToken tokens
    * on holder's behalf. Makes use of the new DAI permit() method. Permissioning is performed by 
    * signature verification. 
    * 
    * Method exposed to give user agency over revoking/approving, setting expiry, spender etc. 
    *
    * @param linkedTokenAddress - address of the linkedToken
    * @param holder - owner of the ERC20 tokens, which are being approved to be spent by the spender
    * @param nonce - permit nonce used for signature replay protection
    * @param allowed - bool representing whether approval is being granted or revoked
    * @param expiry - period of time for which the approval is valid
    * @param spender - address being approved to spend 
    * @param signature - EIP712 signature supplied to permit() for granting approval
    */
    function permit(
        address linkedTokenAddress,
        address holder,
        uint256 nonce,
        bool allowed,
        uint256 expiry,
        address spender,
        bytes memory signature
    ) public {
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

