## Creating a note registry

An instance of a note registry is created inside ACE, via `createNoteRegistry(address _linkedTokenAddress, uint256 _scalingFactor, bool _canAdjustSupply, bool _canConvert)`.

The `_canAdjustSupply` flag defines whether the note registry owner an directly modify the note registry state by minting and burning AZTEC notes. The `_canConvert` flags defines whether ERC20 tokens from `_linkedTokenAddress` can be converted into AZTEC notes. If `_canConvert` is `false`, then `_linkedTokenAddress = address(0)` and the asset is a fully private asset.

For a given note registry, only the owner can call `ACE.updateNoteRegistry`, `ACE.mint` or `ACE.burn`. Traditionally this is imagined to be a `zkAsset` smart contract. This allows the `zkAsset` contract to have absolute control over what types of proof can be used to update the note registry, as well as the conditions under which updates can occur (if extra validation logic is required, for example).

## Note Registry Variables

### `NoteRegistryBehaviour behaviour`

Address of the note registry behaviour contract, cast with the specific version of the `NoteRegistryBehaviour` interace being used.

### `IERC20Mintable linkedToken`

Address of the linked `ERC20` token, cast with the required interface `IERC20Mintable`.

### `uint24 latestFactory`

Unique ID of the latest note registry factory contract version.

### `uint256 totalSupply`

This variable represents the total amount of tokens that currently reside within `ACE` as a result of tokens being converted into AZTEC notes, for a given note registry.

### `totalSupplemented`

Total number of tokens supplemented to the ACE, as a result of tokens being transferred when conversion of minted notes to public value was attempted and there were not sufficient tokens held by ACE.

### `mapping (address => mapping(bytes32 => uint256)) publicApprovals`

Mapping of `publicOwner` => `proofHash` => number of tokens approved to be spent on behalf of that `proof` and `publicOwner`.

It should be noted that the various `NoteRegistryBehaviour` versions may have a different set of variables, as specified in the relevant interface contract. These can include:

### `bytes32 confidentialTotalMinted`

This variable is the keccak256 hash of an AZTEC UTXO note that defines the total amount of value that a note registry has directly minted.

When a note registry is created, this note is set to be an AZTEC UTXO note that has a value of `0` and a viewing key of `1`.

### `bytes32 confidentialTotalBurned`

This variable is the kecckak256 hash of an AZTEC UTXO note that defines the total amount of value that a note registry has directly burned.

When a note registry is created, this note is set to be an AZTEC UTXO note that has a value of `0` and a viewing key of `1`.

### `uint256 scalingFactor`

If this registry permits conversions from AZTEC notes into tokens, `scalingFactor` defines the number of tokens that an AZTEC note value of `1` maps to.

This is required because the maximum value of an AZTEC note is approximately `2^26` (it is dependent on ACE's common reference string) - there is an associated loss of precision when converting a `256` bit variable into a `26` bit variable.

### `ERC20 linkedToken`

This is the address of the registry's linked ERC20 token. Only one token can be linked to an address.

### `canAdjustSupply`

Flag determining whether the note registry has minting and burning priviledges.

### `canConvert`

Flag determining whether the note registry has public to private, and vice versa, conversion priviledges.

## Implementation and upgradeability

In order to guarantee the correct implementation of any operation affecting the state of note registries within the AZTEC ecosystem, all of the data and behaviour relating to note registries is encapsulated in the AZTEC Cryptography Engine.

However, it is likely that the behaviour of note registries will need to be modified in the future in order to accomodate potential functionality improvements such as added support for new types of linked public tokens, mixers etc. To allow this to happen without requiring a hard fork, note registries have been made upgradeable and broken out from the immutable ACE contract into their own upgradeable modules.

Various considerations were taken into account when designing this architecture.

Firstly, the data stored in these registries is obviously very sensitive, and valuable. Upgrades should be rare, backwards compatible, and no upgrade should result in funds becoming inaccessible, partly or wholly un-spendable, or otherwise compromised.

In addition, despite being encapsulated inside of ACE, note registries are owned by ZkAssets. These asset owners should have complete agency over their implementation and so the only entities which should be allowed to upgrade the note registry associated to a particular ZkAsset is its owner.

The implementation of all behaviour which affects the state of all note registries should also be controlled and vetted by the owner of ACE, and ZkAsset owners should not be able to upgrade to arbitrary implementations. This is to protect the integrity of the registries.

The upgrade pattern, or any individual upgrade itself, should also not compromise the hard link between a ZkAsset and its note registry (i.e. no non-authorised contract or account should be able to affect the state of the note registry through an upgrade or because note registries are upgradeable).

Of the various upgradeability patterns available, the unstructured storage proxy pattern developed by Open Zeppelin is used. The foundation of this pattern is to seperate the storage of the note registry, which defines the set of valid notes, from the logic, behaviour and methods of the note registry. There are four base contracts involved in this implementation: `Behaviour.sol`, `AdminUpgradeabilityProxy.sol`, `Factory.sol` and `NoteRegistryManager.sol`.

### Behaviour contract - `Behaviour.sol`

The behaviour contract defines the methods and contains the logic of the note registry. It is this contract that is the mutable, upgradeable contract and the method whereby the implementation of note registry methods is upgraded. All behaviour contracts must abide by a set minimum API in order to maintain compatibility with ACE:

```static solidity
/**
 * @title/**
 * @title NoteRegistryBehaviour interface which defines the base API
        which must be implemented for every behaviour contract.
 * @author AZTEC
 * @dev This interface will mostly be used by ACE, in order to have an API to
        interact with note registries through proxies.
 * The implementation of all write methods should have an onlyOwner modifier.
 *
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
contract NoteRegistryBehaviour is Ownable, IAZTEC {
    using SafeMath for uint256;

    bool public isActiveBehaviour;
    bool public initialised;
    address public dataLocation;

    constructor () Ownable() public {
        isActiveBehaviour = true;
    }

    /**
        * @dev Initialises the data of a noteRegistry. Should be called exactly once.
        *
        * @param _newOwner - the address which the initialise call will transfer ownership to
        * @param _scalingFactor - defines the number of tokens that an AZTEC note value of 1 maps to.
        * @param _canAdjustSupply - whether the noteRegistry can make use of minting and burning
        * @param _canConvert - whether the noteRegistry can transfer value from private to public
            representation and vice versa
    */
    function initialise(
        address _newOwner,
        uint256 _scalingFactor,
        bool _canAdjustSupply,
        bool _canConvert
    ) public;

    /**
        * @dev Fetches data of the registry
        *
        * @return scalingFactor - defines the number of tokens that an AZTEC note value of 1 maps to.
        * @return confidentialTotalMinted - the hash of the AZTEC note representing the total amount
            which has been minted.
        * @return confidentialTotalBurned - the hash of the AZTEC note representing the total amount
            which has been burned.
        * @return canConvert - the boolean whih defines if the noteRegistry can convert between
            public and private.
        * @return canConvert - the boolean whih defines if the noteRegistry can make use of
            minting and burning methods.
    */
    function getRegistry() public view returns (
        uint256 scalingFactor,
        bytes32 confidentialTotalMinted,
        bytes32 confidentialTotalBurned,
        bool canConvert,
        bool canAdjustSupply
    );

    /**
        * @dev Enacts the state modifications needed given a successfully validated burn proof
        *
        * @param _proofOutputs - the output of the burn validator
    */
    function burn(bytes calldata _proofOutputs) external;

    /**
        * @dev Enacts the state modifications needed given a successfully validated mint proof
        *
        * @param _proofOutputs - the output of the mint validator
    */
    function mint(bytes calldata _proofOutputs) external;

    /**
        * @dev Enacts the state modifications needed given the output of a successfully validated proof.
        * The _proofId param is used by the behaviour contract to (if needed) restrict the versions of proofs
        * which the note registry supports, useful in case the proofOutputs schema changes for example.
        *
        * @param _proof - the id of the proof
        * @param _proofOutput - the output of the proof validator
        *
        * @return publicOwner - the non-ACE party involved in this transaction. Either current or desired
        *   owner of public tokens
        * @return transferValue - the total public token value to transfer. Seperate value to abstract
        *   away scaling factors in first version of AZTEC
        * @return publicValue - the kPublic value to be used in zero-knowledge proofs
    */
    function updateNoteRegistry(
        uint24 _proof,
        bytes memory _proofOutput
    ) public returns (
        address publicOwner,
        uint256 transferValue,
        int256 publicValue
    );

    /**
        * @dev Sets confidentialTotalMinted to a new value. The value must be the hash of a note;
        *
        * @param _newTotalNoteHash - the hash of the note representing the total minted value for an asset.
    */
    function setConfidentialTotalMinted(bytes32 _newTotalNoteHash) internal returns (bytes32);

    /**
        * @dev Sets confidentialTotalBurned to a new value. The value must be the hash of a note;
        *
        * @param _newTotalNoteHash - the hash of the note representing the total burned value for an asset.
    */
    function setConfidentialTotalBurned(bytes32 _newTotalNoteHash) internal returns (bytes32);

    /**
        * @dev Gets a defined note from the note registry, and returns the deconstructed object.
            This is to avoid the interface to be
        * _too_ opninated on types, even though it does require any subsequent note type to have
            (or be able to mock) the return fields.
        *
        * @param _noteHash - the hash of the note being fetched
        *
        * @return status - whether a note has been spent or not
        * @return createdOn - timestamp of the creation time of the note
        * @return destroyedOn - timestamp of the time the note was destroyed (if it has been destroyed, 0 otherwise)
        * @return noteOwner - address of the stored owner of the note
    */
    function getNote(bytes32 _noteHash) public view returns (
        uint8 status,
        uint40 createdOn,
        uint40 destroyedOn,
        address noteOwner
    );

    /**
        * @dev Internal function to update the noteRegistry given a bytes array.
        *
        * @param _inputNotes - a bytes array containing notes
    */
    function updateInputNotes(bytes memory _inputNotes) internal;

    /**
        * @dev Internal function to update the noteRegistry given a bytes array.
        *
        * @param _outputNotes - a bytes array containing notes
    */
    function updateOutputNotes(bytes memory _outputNotes) internal;

    /**
        * @dev Internal function to create a new note object.
        *
        * @param _noteHash - the noteHash
        * @param _noteOwner - the address of the owner of the note
    */
    function createNote(bytes32 _noteHash, address _noteOwner) internal;

    /**
        * @dev Internal function to delete a note object.
        *
        * @param _noteHash - the noteHash
        * @param _noteOwner - the address of the owner of the note
    */
    function deleteNote(bytes32 _noteHash, address _noteOwner) internal;
}
```

### Storage/proxy contract - `AdminUpgradeabilityProxy.sol`

The storage contract is referred to as the Proxy and it has four main responsibilities:

-   Store the storage variables which define the set of unspent notes
-   Implement the delegation of calls to behaviour contracts via delegatecall(). In this way, note registry functionality on the behaviour contract is executed in the context of the calling proxy storage contract - allowing behaviour methods access to notes
-   Point the proxy to an upgraded behaviour implementation. This functionality is protected by an authorisation mechanism
-   Faciliate a possible change of admin

The interface is defined as:

```
/**
 * @title ProxyAdmin
 * @dev Minimal interface for the proxy contract to be used by the Factory contract.
 */
contract ProxyAdmin {
    function admin() external returns (address);

    function upgradeTo(address _newImplementation) external;

    function changeAdmin(address _newAdmin) external;
}
```

In order to facilitate the process of upgrading the behaviour contract to a new instance, there are two further classes of contracts: factory contracts and the note registry manager.

### Factory contracts: `Factory.sol`

Factory contracts are used to deploy and link an upgraded behaviour instance to ACE. They are owned by the ACE and there is a factory contract for each type of behaviour instance that can be deployed: adjustable and mixed.

```static solidity
/**
 * @title/**
 * @title NoteRegistryFactory
 * @author AZTEC
 * @dev Interface definition for factories. Factory contracts have the responsibility of managing the full lifecycle of
 * Behaviour contracts, from deploy to eventual upgrade. They are owned by ACE, and all methods should only be callable
 * by ACE.
 **/
contract NoteRegistryFactory is IAZTEC, Ownable  {
    event NoteRegistryDeployed(address behaviourContract);

    constructor(address _aceAddress) public Ownable() {
        transferOwnership(_aceAddress);
    }

    function deployNewBehaviourInstance() public returns (address);

    function handoverBehaviour(address _proxy, address _newImplementation, address _newProxyAdmin) public onlyOwner {
        require(ProxyAdmin(_proxy).admin() == address(this), "this is not the admin of the proxy");
        ProxyAdmin(_proxy).upgradeTo(_newImplementation);
        ProxyAdmin(_proxy).changeAdmin(_newProxyAdmin);
    }
}
```

It is important to detail the versioning system used to keep track of the various factory versions - each factory is associated with a unique ID. The purpose of this ID is to identify the following properties of the factory and the resulting deployed behaviour contract:

-   Epoch - the version number
-   Cryptosystem - the crypto system that the note registry is interfacing with
-   Asset type - the type of asset that the note registry belongs to i.e. is it convertable, adjustable, various combinations of these

Each of these variables is represented by a `uint8`, which are then packed together into a `uint24` to give the unique factory ID. Epoch number can only ever increase and all newly deployed behaviours must be backwards compatible.

### Note registry manager - `NoteRegistryManager.sol`

The note registry manager is inherited by ACE. Its responsibilities include:

-   Define the methods uses to deploy and upgrade registries
-   Define the methods uses to enact state changes sent by the owner of a registry
-   Manage the list of factories that are available

An overview of this architecture is provided below:

![Note-registry-architecture-overview](https://github.com/AztecProtocol/specification/blob/master/noteregistryArchitecture.png?raw=true)

## How an upgrade works

The above system of smart contracts can be used to deploy both non-upgradeable and upgradable `zkAsset`s. Only ownable `ZkAsset`s are able to be upgraded through this upgrade pattern and in the case where there is no owner, the latest note registry behaviour is deployed.

### Deploying a new non-upgradeble ZkAsset

1. A user deploys a ZkAsset contract, feeding in constructor arguments aceAddress, erc20Address, ERC20_SCALING_FACTOR, canAdjustSupply.
2. The ZkAsset calls ACE, telling it to instantiate a note registry
3. ACE, through the NoteRegistryManager, finds the latest Factory, and tells it to deploy a new Proxy contract, and then to deploy a new Behaviour contract, passing the address of the Proxy contract in its constructor.
4. Once deployed, the Factory transfers ownership of the Behaviour to ACE
5. The Factory returns the address of the new Behaviour contract, and ACE adds to a mapping from address of ZkAsset to NoteRegistry.

### Deploying a new NoteRegistry version

1. A new Factory.sol is deployed, which has the ability to deploy new NoteRegistryBehaviour contracts, and can manage transferring ownership from itself to an address it received
2. The Owner of ACE sends a Tx associating a unique identifier with the address of the new Factory

### Upgrading a ZkAsset's Noteregistry

![Upgrade-zkAsset-note-registry](https://github.com/AztecProtocol/specification/blob/master/upgradeZkAssetNoteRegistry.png?raw=true)

1. The Owner of a ZkAsset makes a call to upgrade its NoteRegistry, giving a specific unique id of a particular factory.
2. The ZkAsset calls ACE, telling it to upgrade its NoteRegistry, and passing it a specific version to use.
3. ACE finds the NoteRegistry, fetches its associated Proxy address, and finds the relevant factory to call
4. ACE tells the factory to deploy a new Behaviour, passing in the Proxy address it received.
5. The factory deploys the new Behaviour contract
6. Once deployed, the factory transfers ownership to ACE
7. The address of the deployed Behaviour is sent back to ACE,
8. ACE tells the old Factory to abdicate control over the Proxy contract in favour of the new Factory

## Controlled release

In order to build liquidity in particular assets when AZTEC launches, a slow release period feature has been added in which some assets will be available whilst others will be available after this fixed slow release period ends. The relevant note registry epochs are 2 and 3, implemented in behaviour contracts `Behaviour201911.sol` and `Behaviour201912.sol`.

Assets that have a note registry version of epoch 2 (Behaviour201911) will be **unavailable** during the slow release period:

```static solidity
contract Behaviour201911 is Behaviour201907 {
    uint256 public constant slowReleaseEnd = 1585699199;
    bool public isAvailableDuringSlowRelease = false;

    modifier onlyIfAvailable() {
        // Not sensitive to small differences in time
        require(isAvailableDuringSlowRelease == true || slowReleaseEnd < block.timestamp,
        "AZTEC is in burn-in period, and this asset is not available");
        _;
    }

    function makeAvailable() public onlyOwner {
        require(isAvailableDuringSlowRelease == false, "asset is already available");
        isAvailableDuringSlowRelease = true;
    }

    function updateNoteRegistry(
        uint24 _proof,
        bytes memory _proofOutput
    ) public onlyOwner onlyIfAvailable returns (
        address publicOwner,
        uint256 transferValue,
        int256 publicValue
    ) {
        (
            publicOwner,
            transferValue,
            publicValue
        ) = super.updateNoteRegistry(_proof, _proofOutput);
    }
}
```

The slow release period length is defined by the variable `slowReleaseEnd`, after which the asset will automatically become available. `slowReleaseEnd` is set to the unix timestamp of 1585699199, which corresponds to the 31st March 2020, 23:59:59 UTC. The restricting of availability up to this point is defined through the use of the function modifier `onlyIfAvailable()` which modifiers the behaviour of the key `updateNoteRegistry()` function.

It is also possible for the `ZkAsset` owner to make the asset available earlier than the end of the burn-in period, by calling the `makeAvailable()` method.

Assets that have a note registry version of epoch 3 (Behaviour201912) will be **available** during the slow release period. They have no concept of the `onlyIfAvailable()` modifier:

```static solidity
contract Behaviour201912 is Behaviour201911 {
    // redefining to always pass
    modifier onlyIfAvailable() {
        _;
    }

    function makeAvailable() public onlyOwner {}

    function updateNoteRegistry(
        uint24 _proof,
        bytes memory _proofOutput
    ) public onlyOwner returns (
        address publicOwner,
        uint256 transferValue,
        int256 publicValue
    ) {
        (
            publicOwner,
            transferValue,
            publicValue
        ) = super.updateNoteRegistry(_proof, _proofOutput);
    }
}
```

## Current note registry versions

There are currently three versions/epochs of the note registry behaviour contract. Each inherits from the previous contract epoch and adds additional functionality. This is summarised below:

| Epoch | Contract            | Functionality                                        |
| ----- | ------------------- | ---------------------------------------------------- |
| 1     | Behaviour201907.sol | Base note registry behaviour implementation          |
| 2     | Behaviour201911.sol | Asset that is unavailable during slow release period |
| 3     | Behaviour201912.sol | Asset that is available during slow release period‌  |
