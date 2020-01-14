pragma solidity >=0.5.0 <0.6.0;

import "../../protocol/contracts/libs/LibEIP712.sol";

/**
 * @title AZTECAccountRegistry implementation
 * @author AZTEC
 * Copyright Spilbury Holdings Ltd 2019. All rights reserved.
 **/

contract AZTECAccountRegistry is LibEIP712 {
    mapping(address => bytes) public accountMapping;
    mapping(address => address) public accountAliasMapping;

    struct AZTECAccount {
        address account;
        bytes linkedPublicKey;
    }

    string private constant EIP712_DOMAIN  = "EIP712Domain(string name,string version,address verifyingContract)";
    string private constant SIGNATURE_TYPE = "AZTECAccount(address account,bytes linkedPublicKey)";

    bytes32 private constant EIP712_DOMAIN_TYPEHASH = keccak256(abi.encodePacked(EIP712_DOMAIN));
    bytes32 private constant SIGNATURE_TYPEHASH = keccak256(abi.encodePacked(SIGNATURE_TYPE));

    function hashAZTECAccount(AZTECAccount memory _AZTECAccount) internal view returns (bytes32){
        bytes32 DOMAIN_SEPARATOR = keccak256(abi.encode(
            EIP712_DOMAIN_TYPEHASH,
            keccak256("AZTECAccountRegistry"),
            keccak256("2"),
            address(this)
        ));

        return keccak256(abi.encodePacked(
            "\x19\x01",
            DOMAIN_SEPARATOR,
            keccak256(abi.encode(
                SIGNATURE_TYPEHASH,
                _AZTECAccount.account,
                keccak256(bytes(_AZTECAccount.linkedPublicKey)
        )))));
    }

    event RegisterExtension(
        address indexed account,
        bytes linkedPublicKey,
        bytes spendingPublicKey
    );

    /**
     * @dev Registers a specific public key pair to an ethereum address if a valid signature is provided or the
     * sender is the ethereum address in question        *
     * @param _account - address the address to which a public key is being registered
     * @param _aliasAddress - the address to which a linked public key is being registered
     * @param _linkedPublicKey - the public key the sender wishes to link to the _account
     * @param _signature - an EIP712 compatible signature of the acount & public key
     */
    function registerAZTECExtension(
        address _account,
        address _aliasAddress,
        bytes memory _linkedPublicKey,
        bytes memory _spendingPublicKey,
        bytes memory _signature
    ) public {
        address signer = recoverSignature(
            hashAZTECAccount(AZTECAccount(_account, _linkedPublicKey)),
            _signature
        );
        require(_account == signer, "signer must be the account");

        accountAliasMapping[_account] = _aliasAddress;
        accountMapping[_account] = _linkedPublicKey;

        emit RegisterExtension(_account, _linkedPublicKey, _spendingPublicKey);
    }
}
