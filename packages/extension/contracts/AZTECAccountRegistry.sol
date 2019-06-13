pragma solidity >=0.5.0 <0.6.0;

import "../../protocol/contracts/libs/LibEIP712.sol";

/**
 * @title AZTECAccountRegistry implementation 
 * @author AZTEC 
 * Copyright Spilbury Holdings Ltd 2019. All rights reserved.
 **/

contract AZTECAccountRegistry is LibEIP712 {

    mapping(address => bytes) public accountMapping;

    // EIP712 Domain Name value
    string constant internal EIP712_DOMAIN_NAME = "AZTEC_ACCOUNT_REGISTRY"; 
    // EIP712 Domain Version value
    string constant internal EIP712_DOMAIN_VERSION = "1";

    bytes32 constant internal REGISTER_EXTENSION_SIGNATURE_TYPEHASH = keccak256(abi.encodePacked(
        "RegisterExtensionSignature(",
            "address account,",
            "bytes linkedPublicKey",
        ")"
    ));

    constructor ()
        public
    {
        EIP712_DOMAIN_HASH = keccak256(abi.encode(
            EIP712_DOMAIN_SEPARATOR_SCHEMA_HASH,
            keccak256(bytes(EIP712_DOMAIN_NAME)),
            keccak256(bytes(EIP712_DOMAIN_VERSION)),
            address(this)
        ));
    }

    event RegisterExtension(
        address account,
        bytes linkedPublicKey
    );
    /**
    * @dev function to validate the user is either the sender or has submitted an EIP712 signature from the account they
    * are registering in the AZTEC extension.
    **/

    modifier _onlyUser (
        address _account,
        address _sender,
        bytes memory _linkedPublicKey,
        bytes memory _signature
    ) {
        address signer = _sender;
        if(_signature.length != 0) {
            // validate EIP712 signature

            bytes32 _hashStruct = keccak256(abi.encode(
                    REGISTER_EXTENSION_SIGNATURE_TYPEHASH,
                    _account,
                    _linkedPublicKey
            ));
            bytes32 msgHash = hashEIP712Message(_hashStruct);
            signer = recoverSignature(
                msgHash,
                _signature
            );
        }
        require(_account == signer, 'sender must be the account');
        _;
    }


    /**
        * @dev Registers a specific public key pair to an ethereum address if a valid signature is provided or the
        * sender is the ethereum address in question        * 
        * @param _account - address the address to which a public key is being         registered 
        * @param _linkedPublicKey - the public key the sender wishes to link to the _account
    */

    function registerAZTECExtension(
        address _account,
        bytes memory _linkedPublicKey,
        bytes memory _signature
    )
    _onlyUser(
        _account,
        msg.sender,
        _linkedPublicKey,
        _signature
    ) public {
        accountMapping[_account] = _linkedPublicKey;
        // emit event for the graph
        emit RegisterExtension(_account, _linkedPublicKey);
    }

}
