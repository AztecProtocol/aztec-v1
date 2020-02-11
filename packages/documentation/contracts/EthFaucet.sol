pragma solidity >=0.5.0 <0.6.0;

/**
 * @title ETHFaucet implementation
 * @author AZTEC
 * Copyright Spilbury Holdings Ltd 2019. All rights reserved.
 **/

import "@openzeppelin/upgrades/contracts/Initializable.sol";

import "@openzeppelin/contracts-ethereum-package/contracts/GSN/GSNRecipient.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/cryptography/ECDSA.sol";


contract AccountRegistry {
    mapping(address => bytes) public accountMapping;
}



contract EthFaucet is Initializable, GSNRecipient {
    mapping(address =>uint256) public faucetMapping;
	address trustedSigner;
  address accountRegistryAddress;
    event GSNTransactionProcessed(bytes32 indexed signatureHash, bool indexed success, uint actualCharge);

    constructor(address _accountRegistryAddress, address _trustedAddress) public {
       accountRegistryAddress = _accountRegistryAddress;
        initialize(_trustedAddress);
    }

    /**
     * @dev Sets the trusted signer that is going to be producing signatures to approve relayed calls.
     */
    function initialize(address _trustedSigner) public initializer {
        require(_trustedSigner != address(0), "GSNRecipientSignature: trusted signer is the zero address");
        trustedSigner = _trustedSigner;

        GSNRecipient.initialize();
    }

    // @dev allow users to request 0.1eth every 24 hours
    function requestTestEth(address _recipient) public payable {
      // bytes memory linkedPublicKey = AccountRegistry(accountRegistryAddress).accountMapping(_recipient);

      // require(linkedPublicKey.length > 0, 'Please register this address with the SDK to request ETH');
      require(faucetMapping[_recipient] +  1 days <= block.timestamp, 'Greedy please wait 24hours between requests');

      faucetMapping[_recipient] = block.timestamp;

      address payable recipient = address(uint160(_recipient)); // Correct since Solidity >= 0.5.0

      _recipient.call.value(100000000000000000).gas(20317)("");
    }


	function () external payable {

	}


    using ECDSA for bytes32;

    uint256 constant private RELAYED_CALL_REJECTED = 11;

    enum GSNRecipientSignatureErrorCodes {
        INVALID_SIGNER,
        INVALID_TIMESTAMP
    }


    /**
     * @dev Return this in acceptRelayedCall to impede execution of a relayed call. No fees will be charged.
     */
    function _rejectRelayedCall(uint256 errorCode, bytes memory context) internal pure returns (uint256, bytes memory) {
        return (RELAYED_CALL_REJECTED + errorCode, context);
    }

    /**
     * @dev Ensures that only transactions with a trusted signature can be relayed through the GSN.
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

        if (keccak256(blob).toEthSignedMessageHash().recover(signature) == trustedSigner) {
            if (block.timestamp > maxTimestamp) {
                return _rejectRelayedCall(uint256(GSNRecipientSignatureErrorCodes.INVALID_TIMESTAMP), context);
            }
            return _approveRelayedCall(context);
        } else {
            return _rejectRelayedCall(uint256(GSNRecipientSignatureErrorCodes.INVALID_SIGNER), context);
        }
    }


    function _preRelayedCall(bytes memory) internal returns (bytes32) {
        // solhint-disable-previous-line no-empty-blocks
    }

    function _postRelayedCall(bytes memory context, bool success, uint256 actualCharge, bytes32 preRetVal) internal {
        (bytes memory approveData) = abi.decode(context, (bytes));
        emit GSNTransactionProcessed(keccak256(approveData), success, actualCharge);
    }

}

