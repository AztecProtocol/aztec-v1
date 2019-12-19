pragma solidity >=0.5.0 <0.6.0;


contract IAccountRegistryBehaviour {
    uint256 public epoch;

    struct AZTECAccount {
        address account;
        bytes linkedPublicKey;
    }

    function registerAZTECExtension(
        address _account,
        bytes calldata _linkedPublicKey,
        bytes calldata _spendingPublicKey,
        bytes calldata _signature
    ) external;


    event RegisterExtension(
        address indexed account,
        bytes linkedPublicKey,
        bytes spendingPublicKey 
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
}
