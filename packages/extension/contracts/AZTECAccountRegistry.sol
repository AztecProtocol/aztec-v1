pragma solidity >=0.5.0 <0.6.0;

import "../../protocol/contracts/libs/LibEIP712.sol";

/**
 * @title AZTECAccountRegistry implementation
 * @author AZTEC
 * Copyright Spilbury Holdings Ltd 2019. All rights reserved.
 **/

contract AZTECAccountRegistry is LibEIP712 {

    mapping(address => bytes) public accountMapping;


    struct AZTECAccount {
        address account;
        bytes linkedPublicKey;
    }

    string private constant EIP712_DOMAIN  = "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract,bytes32 salt)";
    string private constant SIGNATURE_TYPE = "AZTECAccount(address account,bytes linkedPublicKey)";

    bytes32 private constant EIP712_DOMAIN_TYPEHASH = keccak256(abi.encodePacked(EIP712_DOMAIN));
    bytes32 private constant SIGNATURE_TYPEHASH = keccak256(abi.encodePacked(SIGNATURE_TYPE));

    uint chainId;
    address owner = msg.sender;

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    constructor (uint _chainId) public {
        chainId = _chainId;
    }

    function hashAZTECAccount(AZTECAccount memory _AZTECAccount) internal view returns (bytes32){
        bytes32 DOMAIN_SEPARATOR = keccak256(abi.encode(
            EIP712_DOMAIN_TYPEHASH,
            keccak256("AZTECAccountRegistry"),
            keccak256("2"),
            chainId,
            address(this),
            0xf2d857f4a3edcb9b78b4d503bfe733db1e3f6cdc2b7971ee739626c97e86a558
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

    function updateChainId(uint _chainId) external onlyOwner {
        chainId = _chainId;
    }

    event RegisterExtension(
        address indexed account,
        bytes linkedPublicKey
    );

    event LogAddress(
        address account
    );
    event LogString(
        string message
    );

    event LogBytes(
        bytes32 sig
    );

    /**
        * @dev function to validate the user is either the sender or has submitted an EIP712 signature from the account they
        * are registering in the AZTEC extension.
    **/


    /**
     * @dev Registers a specific public key pair to an ethereum address if a valid signature is provided or the
     * sender is the ethereum address in question        *
     * @param _account - address the address to which a public key is being         registered
     * @param _linkedPublicKey - the public key the sender wishes to link to the _account
     */

    function registerAZTECExtension(
        address _account,
        bytes memory _linkedPublicKey,
        uint8 v,
        bytes32 r,
        bytes32 s
        // bytes memory _signature
    ) public {
        emit LogAddress(address(this));
            // valid EIP712 signature
        address signer = ecrecover(
            hashAZTECAccount(AZTECAccount(_account, _linkedPublicKey)),
            v,r,s
        );
        emit LogAddress(signer);
        require(_account == signer, 'signer must be the account');
        accountMapping[_account] = _linkedPublicKey;
        // emit event for the graph
        emit RegisterExtension(_account, _linkedPublicKey);
    }

}
