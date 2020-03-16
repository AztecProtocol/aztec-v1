pragma solidity >=0.5.0 <0.6.0;

import "../20200106/Behaviour20200106.sol";

/**
 * @title Behaviour20200207 implementation
 * @author AZTEC
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
contract Behaviour20200207 is Behaviour20200106 {
    /**
    * @dev epoch number, used for version control in upgradeability. The naming convention is based on the
    * date on which the contract was created, in the format: YYYYMMDD
    */
    uint256 public epoch = 20200207;

    /**
    * @dev The updated trustedGSNSigner address, to be used in acceptRelayedCall()
    */
    address public GSNSigner;

    /**
    * @dev Set the GSN signer address for this behaviour contract
    */
    function setGSNSigner() public {
        GSNSigner = 0x5323B6bbD3421983323b3f4f0B11c2D6D3bCE1d8;
    }

    /**
     * @dev Overwrite the accceptRelayedCall() method of Behaviour20200106.sol, to allow it 
     * to be used with an updated GSN signer address. 
     * Method used to ensure that only transactions with a trusted signature can be relayed through the GSN.
     */
    function acceptRelayedCall(
        address relay,
        address from,
        bytes calldata encodedFunction,
        uint256 transactionFee,
        uint256 gasPrice,
        uint256 gasLimit,
        uint256 nonce,
        bytes calldata approvalData,
        uint256
    )
        external
        view
        returns (uint256, bytes memory context)
    {
        (
            uint256 maxTimestamp,
            bytes memory signature
        ) = abi.decode(approvalData, (uint256, bytes));

        bytes memory blob = abi.encodePacked(
            relay,
            from,
            encodedFunction,
            transactionFee,
            gasPrice,
            gasLimit,
            nonce, // Prevents replays on RelayHub
            getHubAddr(), // Prevents replays in multiple RelayHubs
            address(this), // Prevents replays in multiple recipients
            maxTimestamp // Prevents sends tx after long perion of time
        );
        context = abi.encode(signature);

        if (keccak256(blob).toEthSignedMessageHash().recover(signature) == GSNSigner) {

            if (block.timestamp > maxTimestamp) {
                return _rejectRelayedCall(uint256(GSNRecipientSignatureErrorCodes.INVALID_TIMESTAMP), context);
            }
            return _approveRelayedCall(context);
        } else {
            return _rejectRelayedCall(uint256(GSNRecipientSignatureErrorCodes.INVALID_SIGNER), context);
        }
    }
}
