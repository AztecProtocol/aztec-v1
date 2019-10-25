
pragma solidity >=0.5.0 <0.6.0;

// import "./GSNBouncerBase.sol";
import "../../protocol/contracts/libs/LibEIP712.sol";

/**
 * @title AZTECAccountRegistry implementation
 * @author AZTEC
 * Copyright Spilbury Holdings Ltd 2019. All rights reserved.
 **/

contract AZTECAccountRegistry is LibEIP712 {

    // mapping(address => bytes) public accountMapping;


    // struct AZTECAccount {
    //     address account;
    //     bytes linkedPublicKey;
    // }

    // struct PendingRegistration {
    //     address account;
    //     bytes linkedPublicKey;
    //     bytes32 commitHash;
    //     uint256 blockHeight;
    // }


    // string private constant EIP712_DOMAIN  = "EIP712Domain(string name,string version,address verifyingContract)";
    // string private constant SIGNATURE_TYPE = "AZTECAccount(address account,bytes linkedPublicKey)";

    // bytes32 private constant EIP712_DOMAIN_TYPEHASH = keccak256(abi.encodePacked(EIP712_DOMAIN));
    // bytes32 private constant SIGNATURE_TYPEHASH = keccak256(abi.encodePacked(SIGNATURE_TYPE));

    // function hashAZTECAccount(AZTECAccount memory _AZTECAccount) internal view returns (bytes32){
    //     bytes32 DOMAIN_SEPARATOR = keccak256(abi.encode(
    //         EIP712_DOMAIN_TYPEHASH,
    //         keccak256("AZTECAccountRegistry"),
    //         keccak256("2"),
    //         address(this)
    //     ));
    //         return keccak256(abi.encodePacked(
    //             "\x19\x01",
    //             DOMAIN_SEPARATOR,
    //             keccak256(abi.encode(
    //                 SIGNATURE_TYPEHASH,
    //                 _AZTECAccount.account,
    //                 keccak256(bytes(_AZTECAccount.linkedPublicKey)
    //         )))));
    // }


    // event RegisterExtension(
    //     address indexed account,
    //     bytes linkedPublicKey,
    //     bytes spendingPublicKey 
    // );

    // event LogAddress(
    //     address account
    // );
    // event LogString(
    //     string message
    // );

    // event LogBytes(
    //     bytes32 sig
    // );

    // mapping(bytes32 => bool) public registrationHashes;
    // mapping(bytes32 => bytes32) public pendingRegistrations;

    // /**
    //  * @dev Adds a set of unique hashes that correspond to registration codes to the mapping  
    //  * owner is the ethereum address of the AZTEC multisig        *
    //  * @param _hashes - arrray of hashes (bytes32) to add to the mapping.
    //  */

    // function addRegistrationCodes(bytes32[] _hashes) onlyOwner {
    //     for (uint i=0; i<_hashes.length; i++) {
    //         registrationHashes[_hashes[i]] = true;
    //   }
    // }


    // /**
    //  * @dev Registers a specific public key pair to an ethereum address if a valid signature is provided or the
    //  * sender is the ethereum address in question        *
    //  * @param _account - address the address to which a public key is being         registered
    //  * @param _linkedPublicKey - the public key the sender wishes to link to the _account
    //  * @param _signature - an EIP712 compatible signature of the acount & public key 
    //  */

    // function commitToRegisterAZTECExtension(
    //     address _account,
    //     bytes memory _linkedPublicKey,
    //     bytes memory _spendingPublicKey,
    //     bytes memory _signature,
    //     bytes32 _registrationHash,
    //     bytes32 _commitHash
    // ) public {
    //     address signer = recoverSignature(
    //         hashAZTECAccount(AZTECAccount(_account, _linkedPublicKey)),
    //         _signature
    //     );
    //     require(_account == signer, 'signer must be the account');

    //     require(pendingRegistrations[_registrationHash] == 0, 'the registration code has already been taken');

    //     // now we reserve the registration code with out commit
    //     pendingRegistrations[_registrationHash] = PendingRegistration(
    //                                                         _account,
    //                                                         _linkedPublicKey,
    //                                                         _commitHash,
    //                                                         block.height
    //                                             );

    // }

    // function registerAZTECExtension(
    //     bytes32 _registrationHash,
    //     bytes32 _commitHash,
    //     string _registrationCode
    //     string _salt
    // ) public {
    //     PendingRegistration registration = pendingRegistrations[_registrationHash];
    //     require(registration.commitHash == _commitHash, 'commit hash does not match');
    //     require(keccak256(_registrationCode) == _registrationHash,  'code does not match registration hash');
    //     require(keccak256(_registrationCode, _salt) == _commitHash,  'hash does not match commit hash');
    //     // TODO check the block height is at least n appart to stop front running.  registrationHashes[_registrationHash] = false;

    //     accountMapping[registration._account] = registration._linkedPublicKey;
    //     // emit event for the graph
    //     emit RegisterExtension(_account, _linkedPublicKey, _spendingPublicKey);
        
    // }

    // /**
    //  * @dev Ensures that only transactions with a trusted signature can be relayed through the GSN.
    //  */

    // function acceptRelayedCall(
    //     address relay,
    //     address from,
    //     bytes calldata encodedFunction,
    //     uint256 transactionFee,
    //     uint256 gasPrice,
    //     uint256 gasLimit,
    //     uint256 nonce,
    //     bytes calldata approvalData,
    //     uint256
    // )
    //     external
    //     view
    //     returns (uint256, bytes memory)
    // {
        
    //     // this is less than ideal we have to allow all registration txs but we limit who is registered with this
    //     // strategy

    //     // other options
    //         // have an API server that signs messages from a key 
    //         // have an API server that signs messages from a key 

    //     if(encodedFunction == this.commitToRegisterAZTECExtension.selector) {
    //             return _approveRelayedCall();
    //     }

    //     if(encodedFunction == this.registerAZTECExtension.selector) {
    //             return _approveRelayedCall();
    //     }
        
    //     // TODO we need to check the encodedFunction to see which strategy to use
    //     if(encodedFunction == this.zkAssetRelay.selector) {
    //         if(accountMapping[from].GSNEnabled) {
    //             return _approveRelayedCall();
    //         }
    //     }
        

    //     return _rejectRelayedCall()
    // }

}
