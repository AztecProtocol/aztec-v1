
The `AccountRegistry` is a key smart contract in the AZTEC ecosystem that enables important implementation/application level features - it is not involved in the zero-knowledge proof systems. 

It enables two features:
1) User registration with AZTEC's SDK (software development kit)
2) Gasless meta-transactions via the GSN (gas station network)

The contract has also been made upgradeable, to allow new methods for the above functionality to be added and to allow the contract to evolve and potentially take on additional functionality in the future. The following sections firstly describe the role the `AccountRegistry` contract plays in enabling the above features, as well as explaining the upgrade mechanism it employs.  

The `AccountRegistry.sol` contract has the following interface:

``` static solidity
contract IAccountRegistryBehaviour {
    uint256 public epoch;

    struct AZTECAccount {
        address account;
        bytes linkedPublicKey;
    }

    mapping(address => bytes) public accountMapping;
    mapping(address => address) public userToAZTECAccountMapping;
    mapping(bytes32 => bool) public signatureLog;

    function registerAZTECExtension(
        address _account,
        address _AZTECaddress,
        bytes calldata _linkedPublicKey,
        bytes calldata _spendingPublicKey,
        bytes calldata _signature
    ) external;

    function confidentialTransferFrom(
        uint24 _proofId,
        address _registryOwner,
        bytes memory _proofData,
        address _spender,
        bytes memory _proofSignature
    ) external;

    function deposit(
        address _registryOwner,
        address _owner,
        bytes32 _proofHash,
        bytes memory _proofData,
        uint256 _value
    ) external;
    
    function initialize(address _aceAddress, address _trustedGSNSignerAddress) initializer external;

    function publicApprove(address _registryOwner, bytes32 _proofHash, uint256 _value) external;

    event Addresses(address accountAddress, address signerAddress);
    
    event RegisterExtension(
        address indexed account,
        bytes linkedPublicKey,
        bytes spendingPublicKey 
    );
}

```
## Feature enabling role
### User registration with the SDK
The AZTEC SDK is a high level library with a UI component which abstracts away many of the complexities involved in using AZTEC - such as note and viewing key management. In order to first use the SDK, users need to register with it the Ethereum address that they will use to interact with AZTEC.  

Each user is generated a `linkedPublicKey` and `AZTECaddress` when they first sign up with the SDK. The `linkedPublicKey` is a 32 byte public key defined over the elliptic curve `curve25519`, which is later used to encrypt that user's viewing key in the note `metaData`. This `linkedPublicKey` has a corresponding privateKey, call it `PK`, which is stored in the SDK.  

When transactions are being sent via the GSN and having their gas paid for, the SDK first programmatically signs the transaction with the user's `PK` over Ethereum's `secp256k1`. This is done, rather than through MetaMask, to save on a MetaMask popup signing prompt. The address that is recovered from a transaction signed in this way, using `ecrecover` is called the `AZTECaddress`. 

These two variables `linkedPublicKey` and `AZTECaddress` are then passed to `registerAZTECExtension()`:
``` static solidity
/**
 * @dev Registers a linkedPublicKey to an Ethereum address, if a valid signature is provided or the
 * sender is the ethereum address in question
 * @param _account - address to which the linkedPublicKey is being registered
 * @param _AZTECaddress - corresponding to the private key of `linkedPublicKey` over the secp256k1 curve
 * @param _linkedPublicKey - an additional public key which the sender wishes to link to the _account
 * @param _spendingPublicKey - the Ethereum public key associated with the Ethereum address 
 * @param _signature - an EIP712 compatible signature of the account & linkedPublicKey
 */
AccountRegistry.registerAZTECExtension(
        address _account,
        address _AZTECaddress,
        bytes memory _linkedPublicKey,
        bytes memory _spendingPublicKey,
        bytes memory _signature
)
```
The result of calling this method is principally that two mappings are set:

``` static solidity
mapping(address => bytes) public accountMapping;
mapping(address => address) public userToAZTECAccountMapping;


accountMapping[_account] = _linkedPublicKey;
userToAZTECAccountMapping[_account] = _AZTECaddress;
```

The `accountMapping` maps the user's Ethereum address to their `linkedPublicKey`. This is used in the SDK as a lookup/easy reference to find a particular user's `linkedPublicKey`. 

The `userToAZECAccountMapping` maps a user's Ethereum address to their `AZTECaddress` - the one that would be recovered if the `linkedPublicKey` private key was used to sign a tx over the Ethereum`secp256k1` curve. This mapping's purpose is to assist with the permissioning around who can call `Behaviour.deposit()` and deposit to a user's address. 


### Meta-transactions via the GSN
To abstract gas away from users, the SDK makes use of the gas station network and it's relayer system to enable meta-transactions. The GSN enabled `recipient` contract in the AZTEC ecosystem is the `AccountRegistry.sol`. 

It enables standard AZTEC functionality principally through two methods: `deposit()` and `confidentialTransferFrom()`. The contract's GSN behaviour is enabled by inheriting from two GSN related contracts:

#### 1) `GSNRecipient.sol` 
This is the base GSN recipient contract which enables standard GSN behaviour such as: keeping track of the original transaction sender via `_msgSender()` and storing the `RelayHub` address.

#### 2) `GSNRecipientTimestampSignature.sol` 
This is a custom AZTEC bouncer GSN contract whose purpose is to restrict/provide permissioning as to which Ethereum accounts are allowed to make use of AZTEC meta-transactions.

The GSN works by requiring that the gas payer, in this case the AZTEC `AccountRegistry` contract, maintain a deposit of Ether on the GSN `RelayHub` contract. This balance decreases over time as user's transactions are processed and paid for. In order to prevent spam and the malicious draining of funds, the `GSNRecipientTimestampSignature.sol` exists to provide permissioning as to which users are eligible to have free transactions. 

It does this through the method `acceptRelayedCall()`. This is called before a transaction is sent and processed by the GSN. It takes `approvalData` as a argument, which is then decoded to generate two parameters: `maxTimestamp` and `signature`. 

##### `maxTimestamp`
`maxTimestamp` represents the maximum length of time for which a signed free transaction is valid to have it's gas paid for.

This is important because although it is AZTEC servers that sign transactions to be relayed, users can technically relay them at any point in time. This opens up the possibility of a malicious user accumulating large numbers of signed transactions and then griefing the AZTEC contracts, draining all the GSN ether. By including the following check in `acceptRelayedCall()` 

``` static solidity
if (block.timestamp > maxTimestamp) {
    return _rejectRelayedCall(uint256(GSNRecipientSignatureErrorCodes.INVALID_TIMESTAMP), context);
}
```

griefing attacks are mitigated. 

`maxTimestamp` is currently set to approximately 2hrs - it is defined and stored on AZTEC servers.

##### `signature`
`signature` is produced using an AZTEC server private key. When a transaction is signed in the SDK using the users `PK`, it is then relayed to AWS. AWS stores the AZTEC server private key, which then signs the transaction object received. This action generates `signature`, which is then used in the permissioning as to which transactions are eligible to have their gas paid for. 

This permissioning works because the AZTEC server private key has a corresponding Ethereum address referred to as the `trustedSigner` or `_trustedGSNSignerAddress`. The `acceptRelayedCall()` method checks in the following segment that the transaction was indeed signed by the `trustedSigner`:

``` static solidity
if (keccak256(blob).toEthSignedMessageHash().recover(signature) == _trustedSigner) {
    if (block.timestamp > maxTimestamp) {
        return _rejectRelayedCall(uint256(GSNRecipientSignatureErrorCodes.INVALID_TIMESTAMP), context);
    }
    return _approveRelayedCall(context);
} else {
    return _rejectRelayedCall(uint256(GSNRecipientSignatureErrorCodes.INVALID_SIGNER), context);
}
```

## Architecture and flow
An overview of the broader architecture in which the `AccountRegistry.sol` sits is presented below. The key steps involved in the flow of a user sending a meta-transaction are highlighted. For the purposes of the flow it is assumed that the user has already registered with the AZTEC SDK.

**Key**
- (UI): user interface
- (S): server
- (C): contract

![Account-registry-overview](https://github.com/AztecProtocol/specification/blob/master/AccountRegistryOverview.png?raw=true)  

1. Dapp makes a request to the SDK to construct a proof (e.g. a JoinSplit)
2. User is prompted for necessary approvals from their custody account (MetaMask). These approvals are either ERC20 allowances, or EIP712 signatures to spend AZTEC notes depending on the type of interaction the dApp requests. (Not always transactions). The SDK also signs the transaction with the user's `linkedPublicKey` private key `PK`.
3. GSN RelayHub is queried, to select a relayer which will be used to relay the eventual transaction
5. Transaction is signed by the AZTEC server private key, stored on AWS - entitling it to have it's gas paid for by AZTEC
6. SDK relays the signed transaction to the selected GSN relayer
7. GSN relayer sends the transaction which calls the appropriate method on the `AccountRegistry.sol` contract e.g. `deposit()` or `confidentialTransferFrom()`

## Potential issues to be aware of
The `AccountRegistry` behaviour contract has two issues related to potential front running attacks: https://github.com/AztecProtocol/AZTEC/issues/456 and https://github.com/AztecProtocol/AZTEC/issues/461. Both concern potential front-running attacks: the first to block a correct deployment, and the second to tip off an attacker that a user's key has been compromised. 

### 1) Front-running to block a correct deployment: https://github.com/AztecProtocol/AZTEC/issues/456
As explained in the linked issue, initializing the `Behaviour20200106.sol` contract requires that the `initialize()` method is called. There is no access permission on this function, so it is callable by any address. This means that an attacker could potentially front-run a legitimate initialisation call and supply bogus parameters. 

This would prevent the contract from being used as intended, but given that the method is protected by an `initializer` modifier (so it can only be called once), this attack would be known and another deployment could proceed. As outlined in the issue, extra gas should be used on deploy when calling the `initalize()` method. 

### 2) Front-running in the case of key compromise: https://github.com/AztecProtocol/AZTEC/issues/461
The linked issue details a potential front running attack on the `registerAZTECExtension()` function that is possible in the event of a user key compromise. 

This function registers a user's Ethereum address alongside an `_AZTECaddress`. In the case that the private key to the `AZTECaddress` is compromised, the user would likely re-register by calling `registerAZTECExtension()` with a different linked `AZTECaddress`. An attacker may see this unconfirmed transaction, be tipped off that a key was compromised as a result, and so front-run calls to other functions such as `deposit()`. 

As the linked issue points out, extra gas should be used when calling `registerAZTECExtension()` in the case of a key compromise.

## Upgradeability pattern
To facilitate the potential future addition of other methods whereby AZTEC users can be registered and possible contract purpose expansion, `AccountRegistry.sol` is upgradeable. 

The requirements of the upgrade pattern are: 
- state (i.e. the account mappings) must be preserved between upgrades
- upgrades must be backwards compatible
- only the contract owner should be able to initiate upgrades
- any funds stored by the contract must not become locked as a result of an upgrade 

To achieve this the OpenZeppelin unstructured storage proxy pattern was chosen and implemented. This pattern splits the `AccountRegistry` contract out into two - an immutable proxy contract which preserves state and mutable behaviour contracts which define the various methods. 

Note that the pattern used to make the `AccountRegistry` upgradeable is the same as that used to make the note registries upgradable. There are some implementation differences however, principally that we do not make use of factory contracts to deploy the `AccountRegistry` behaviour contracts. 

### Behaviour contracts - `Behaviour.sol`
This is the contract that defines the method and logic of the `AccountRegistry` and is the upgradeable part of the system. 

To deploy an 'upgraded AccountRegistry', a new `Behaviour` contract would be deployed. This is done manually, unlike in the upgradeability model for note registries. Manual deployment was chosen to make the upgrade simple as simple as possible, and given that there will only be one `AccountRegistry` contract at once the need for factory deploys was reduced. 

It should be noted that in this pattern, all future versions of the `Behaviour` contracts must inherit the storage variables declared by their parents. 

### Storage/proxy contract - `AdminUpgradeabilityProxy.sol` 
The storage contract is referred to as the Proxy. It has several key responsibilities:
- contain the storage variables which define the set of unspent notes
- implements the delegation of calls to behaviour contracts via `delegatecall()`. In this way,  behaviour contract defined functionality can be executed in the context of the calling proxy storage contract - allowing behaviour methods to access and interact with notes. 
- upgrade behaviour, by pointing calls to the addresses of newly deployed behaviour contracts 

In order to facilitate the process of upgrading the behaviour contract to a new instance, there is also an `AccountRegistryManager.sol` contract.

### `AccountRegistryManager.sol`
This contract's purpose is to manage the process of performing upgrades and keeping track of the behaviour instances. By codifying the upgrade process in a smart contract, it reduces the likelihood of human error when performing an upgrade. 

The address of the proxy contract is defined on the `AccountRegistryManager.sol` via the state variable:

```
address payable public proxyAddress;
```

### Upgrade flow
The upgrade flow overall is similar to, but simpler than, that of the note registry upgrade flow

#### Deploying the upgradeable account registry
1)Deploy the initial, first `Behaviour.sol` contract
2)Deploy the `AccountRegistryManager.sol` contract - when the constructor is called it will deploy the proxy contract and link the initial `Behaviour.sol` contract to it

#### Upgrading the account registry
1) Deploy the new `Behaviour.sol` contract
2) Call `upgradeAccountRegistry()` on the `AccountRegistryManager.sol`, passing in the address of the new behaviour contract as a parameter. 


It should be noted that the `AccountRegistryManager.sol` inherits from `Ownable.sol`. This allows the owner of the contract to be set and the upgrade mechanism to then be protected by `onlyOwner` modifiers - preventing unauthorised upgrades. 

### Versioning system 
The behaviour contracts need a versioning system in place in order to keep track of the different behaviours. A simple scheme is in place based on the date on which the contract was created. `Behaviour` contracts are given a unique ID according to the creation date in the form of: YYYYMMDD
