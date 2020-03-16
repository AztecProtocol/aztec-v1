The `zkAsset.sol` contract is an implementation of a confidential token, that follows the [EIP-1724 standard](https://github.com/ethereum/EIPs/issues/1724). It is designed as a template that confidential digital asset builders can follow, to create an AZTEC-compatible asset. All `ZkAssets` must follow the following minimum interface:

``` static solidity
pragma solidity >=0.5.0 <0.6.0;
/**
 * @title IZkAsset
 * @author AZTEC
 * @dev An interface defining the ZkAsset standard
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/

interface IZkAsset {

    /**
     * @dev Note owner can approve a third party address, such as a smart contract,
     * to spend multiple notes on their behalf. This allows a batch approval of notes
     * to be performed, rather than individually for each note via confidentialApprove().
     *
    * @param _proofId - data of proof
     * @param _proofOutputs - data of proof
     * @param _spender - address being approved to spend the notes
     * @param _approval - bool (true if approving, false if revoking)
     * @param _proofSignature - ECDSA signature over the proof, approving it to be spent
     */
    function approveProof(
        uint24 _proofId,
        bytes calldata _proofOutputs,
        address _spender,
        bool _approval,
        bytes calldata _proofSignature
    ) external;

    /**
    * @dev Note owner approving a third party, another address, to spend the note on
    * owner's behalf. This is necessary to allow the confidentialTransferFrom() method
    * to be called
    *
    * @param _noteHash - keccak256 hash of the note coordinates (gamma and sigma)
    * @param _spender - address being approved to spend the note
    * @param _spenderApproval - defines whether the _spender address is being approved to spend the
    * note, or if permission is being revoked. True if approved, false if not approved
    * @param _signature - ECDSA signature from the note owner that validates the
    * confidentialApprove() instruction
    */
    function confidentialApprove(
        bytes32 _noteHash,
        address _spender,
        bool _spenderApproval,
        bytes calldata _signature
    ) external;

    /**
    * @dev Executes a value transfer mediated by smart contracts. The method is supplied with
    * transfer instructions represented by a bytes _proofOutput argument that was outputted
    * from a proof verification contract.
    *
    * @param _proof - uint24 variable which acts as a unique identifier for the proof which
    * _proofOutput is being submitted. _proof contains three concatenated uint8 variables:
    * 1) epoch number 2) category number 3) ID number for the proof
    * @param _proofOutput - output of a zero-knowledge proof validation contract. Represents
    * transfer instructions for the ACE
    */
    function confidentialTransferFrom(uint24 _proof, bytes calldata _proofOutput) external;


    /**
    * @dev Executes a basic unilateral, confidential transfer of AZTEC notes
    * Will submit _proofData to the validateProof() function of the Cryptography Engine.
    *
    * Upon successfull verification, it will update note registry state - creating output notes and
    * destroying input notes.
    *
    * @param _proofData - bytes variable outputted from a proof verification contract, representing
    * transfer instructions for the ACE
    * @param _signatures - array of the ECDSA signatures over all inputNotes
    */
    function confidentialTransfer(bytes calldata _proofData, bytes calldata _signatures) external;

    /**
    * @dev Executes a basic unilateral, confidential transfer of AZTEC notes
    * Will submit _proofData to the validateProof() function of the Cryptography Engine.
    *
    * Upon successfull verification, it will update note registry state - creating output notes and
    * destroying input notes.
    *
    * @param _proofId - id of proof to be validated. Needs to be a balanced proof.
    * @param _proofData - bytes variable outputted from a proof verification contract, representing
    * transfer instructions for the ACE
    * @param _signatures - array of the ECDSA signatures over all inputNotes
    */
    function confidentialTransfer(uint24 _proofId, bytes calldata _proofData, bytes calldata _signatures) external;


    /**
    * @dev Extract a single approved address from the metaData
    * @param metaData - metaData containing addresses according to the schema defined in x
    * @param addressPos - indexer for the desired address, the one to be extracted
    * @return desiredAddress - extracted address specified by the inputs to this function
    */
    function extractAddress(bytes calldata metaData, uint256 addressPos) external returns (address desiredAddress);

    /**
    * @dev Update the metadata of a note that already exists in storage.
    * @param noteHash - hash of a note, used as a unique identifier for the note
    * @param metaData - metadata to update the note with
    */
    function updateNoteMetaData(bytes32 noteHash, bytes calldata metaData) external;

    event CreateZkAsset(
        address indexed aceAddress,
        address indexed linkedTokenAddress,
        uint256 scalingFactor,
        bool indexed _canAdjustSupply,
        bool _canConvert
    );

    event CreateNoteRegistry(uint256 noteRegistryId);

    event CreateNote(address indexed owner, bytes32 indexed noteHash, bytes metadata);

    event DestroyNote(address indexed owner, bytes32 indexed noteHash);

    event ConvertTokens(address indexed owner, uint256 value);

    event RedeemTokens(address indexed owner, uint256 value);

    event UpdateNoteMetaData(address indexed owner, bytes32 indexed noteHash, bytes metadata);
}


```

## Creating a confidential asset  

A `zkAsset` contract must instantiate a note registry inside `ACE` via `ACE.createNoteRegistry`. If the asset is a mixed, the contract address of the linked `ERC20` token must be supplied.

## Issuing a confidential transaction: confidentialTransfer

The primary method of unilateral value transfer occurs via `zkAsset.confidentialTransfer(bytes _proofData, bytes _signatures)`. In this method, the `joinSplit` AZTEC proof is used to enact a value transfer. The beneficiaries of the transaction are defined entirely by the contents of `bytes _proofData`.  

Both `ACE.validateProof(data)` and `ACE.updateNoteRegistry(proofOutput)` must be called, with `proofOutput` being extracted from `ACE.validateProof`'s return data.  

## Issuing delegated confidential transactions: confidentialTransferFrom  

The `confidentialTransferFrom(uint24 __proof, bytes _proofOutput)` method is used to perform a delegated transfer. As opposed to `confidentialTransfer`, `confidentialTransferFrom` can use any proof supported by `ACE` (assuming the `zkAsset` contract accepts this type of proof).  

## Permissioning
It is the responsibility of the `zkAsset` to perform the required permissioning checks when value transfer occurs. The permissioning mechanism used in a `confidentialTransfer()` call is different to that used for a `confidentialTransferFrom()` call.

The `confidentialTransfer` method takes a set of EIP712 ECDSA `signatures` over each `inputNote` that is involved in the transfer. These are then validated in the method `confidentialTransferInternal()`. 

However, this method is not suitable for a delegated transfer calling `confidentialTransferFrom()`. In this case, the note 'owners' may be smart contracts and so unable to create digitial signatures. Therefore, for `confidentialTransferFrom()` to be used, a permission granting function `confidentialApprove()` must be called on every input note that is consumed.

There are two flavours of this permissioning granting function: `confidentialApprove()` and `approveProof()`. The first allows permission to be granted for an individual note, the second allows permission to be granted for a particular proof and so in a single call potentially approve multiple notes for spending.


### confidentialApprove()  

The `confidentialApprove(bytes32 _noteHash, address _spender, bool _status, bytes memory _signature)` method gives the `_spender` address permission to use an AZTEC note, whose hash is defined by `_noteHash`, to be used in a zero-knowledge proof.  

The method has the following interface:

``` static solidity
/**
* @dev Note owner approving a third party, another address, to spend the note on
* owner's behalf. This is necessary to allow the confidentialTransferFrom() method
* to be called
*
* @param _noteHash - keccak256 hash of the note coordinates (gamma and sigma)
* @param _spender - address being approved to spend the note
* @param _spenderApproval - defines whether the _spender address is being approved to spend the
* note, or if permission is being revoked. True if approved, false if not approved
* @param _signature - ECDSA signature from the note owner that validates the
* confidentialApprove() instruction
*/
function confidentialApprove(
    bytes32 _noteHash,
    address _spender,
    bool _spenderApproval,
    bytes memory _signature
) public {}
```

The `_signature` is an ECDSA signature over an EIP712 message. This signature is signed by the `noteOwner` of the AZTEC note being approved.  If `_signature = bytes(0x00)`, then `msg.sender` is expected to be the `noteOwner` of the AZTEC note being approved.  

The method validates the signature and, if this passes, updates a mapping of `noteHash` => `_spender` => `_spenderApproval`:

``` static solidity
mapping(bytes32 => mapping(address => bool)) public confidentialApproved;
```

This mapping will later be checked when an attempt is made to spend the note. 

It should be noted that the `confidentialApprove()` interface is designed to facilitate stealth addresses. For a stealth address, it is unlikely that the address will have any Ethereum funds to pay for gas costs, and a meta-transaction style transaction is required. In this situation, `msg.sender` will not map to the owner of the note and so an ECDSA signatue is used.  

For other uses, such as a smart contract or a non-stealth address, a direct transaction sent by the correct `msg.sender` is possible by sending a null signature.

### approveProof()
This allows spending permission to be granted to multiple notes in a single atomic function call. This is useful for delegating note control over `n` notes in a single transaction, rather than having to make `n` `confidentialApprove()` calls.

The method has the following interface:

``` static solidity
/**
 * @dev Note owner can approve a third party address, such as a smart contract,
 * to spend a proof on their behalf. This allows a batch approval of notes
 * to be performed, rather than individually for each note via confidentialApprove().
 *
 * @param _proofId - id of proof to be approved. Needs to be a balanced proof.
 * @param _proofOutputs - data of proof
 * @param _spender - address being approved to spend the notes
 * @param _proofSignature - ECDSA signature over the proof, approving it to be spent
 */
function approveProof(
    uint24 _proofId,
    bytes calldata _proofOutputs,
    address _spender,
    bool _approval,
    bytes calldata _proofSignature
) external {
```

`_proofSignature` is a signature over the proof generated by the private key of the owner of the notes in question. The method extracts the notes from the `_proofOutputs` object and checks that each note's `noteOwner` matches the address recovered from the `_proofSignature`. 

It then updates the following mapping of `keccak256(proofOutputs)` => `spender` address => `_approval` status:

``` static solidity
mapping(bytes32 => mapping(address => bool)) public confidentialApproved;
```

Later when this proof and associated notes are used in a `confidentialTransferFrom()` transaction, the `confidentialApproved` mapping is queried. Firstly, it is checked if:

``` static solidity
confidentialApproved[proofHash][msg.sender] != true
```

If this is the case then the notes were approved for spending via the `approveProof()` method and the transaction proceeds. If this is not `true`, then for each `inputNote` (notes to be spent) the following is checked:

``` static solidity
confidentialApproved[noteHash][msg.sender] == true
```



### Granting note view key access
AZTEC notes contain a `metaData` field, with a specification as outlined in the note ABI discussion. One of the principal uses of this data field, is to store encrypted viewing keys - to allow note view access to be granted to third parties. The `metaData` of a note is not stored in storage, rather it is emitted as an event along with the successful creation of a note:

``` static solidity
emit CreateNote(noteOwner, noteHash, metadata);
```

It may be desirable to grant note view key access to parties, beyond those for which an encrypted viewing key was initially provided when the note was created. To facilitate this, the `ZkAssetBase.sol` has an `updateNoteMetaData()` method:

``` static solidity
/**
* @dev Update the metadata of a note that already exists in storage. 
* @param noteHash - hash of a note, used as a unique identifier for the note
* @param metaData - metadata to update the note with
*/
function updateNoteMetaData(bytes32 noteHash, bytes memory metaData) public {
    // Get the note from this assets registry
    ( uint8 status, , , address noteOwner ) = ace.getNote(address(this), noteHash);

    bytes32 addressID = keccak256(abi.encodePacked(msg.sender, noteHash));
    require(
        (noteAccess[addressID] >= metaDataTimeLog[noteHash] || noteOwner == msg.sender) && status == 1,
        'caller does not have permission to update metaData'
    );

    // Approve the addresses in the note metaData
    approveAddresses(metaData, noteHash);

    // Set the metaDataTimeLog to the latest block time
    setMetaDataTimeLog(noteHash);

    emit UpdateNoteMetaData(noteOwner, noteHash, metaData);
}
```

The purpose of this method is to ultimately emit a new event `UpdateNoteMetaData(noteOwner, noteHash, metaData)` with updated `metaData`.The `metaData` is the updated `metaData` which contains the encrypted  viewing keys for all parties that are to be granted note view access. 

#### Permissioning
The permissioning of this function is of critical importance - as being able to call this function allows note view access to be given to an arbitrary address. To this end, there is a `require()` statement which enforces that one of the two valid groups of users are calling this function. It will revert if not.

The first category of permissioned caller is the `noteOwner`. A note owner should have complete agency over to whom they grant view key access to their note. 

The second category of permissioned callers are those Ethereum addresses that are being granted view key access in the `metaData`. These addresses are explicitly  stated in the `approvedAddresses` section of `metaData`. 

To enact this check, an `addressID` is first calculated - the `keccak256` hash of `msg.sender` and the hash of the note in question. We then make use of the `noteAccess`  mapping declared in the `ZkAsset`:

``` static solidity
mapping(bytes32 => uint256) public noteAccess;
```

This is a mapping of `addressIDs` to a `uint256` , where the `uint256` is the `block.timestamp` of the block in which the particular address was originally granted approval via `approveAddresses()`.

We then compare `noteAccess[addressID]` to the value stored in `metaDataTimeLog[noteHash]`. `metaDataTimeLog` is a second mapping of the form:

``` static solidity
mapping(bytes32 => uint256) public metaDataTimeLog;
```

It is a mapping of  `noteHash` to the `block.timestamp` when the method `setMetaDataTimeLog()` was last called. This mapping is used to keep track of when the metaData for a particular note was last updated. 

By checking that `noteAccess[addressID] >= metaDataTimeLog[noteHash]` we satisfy two conditions. Firstly, that `msg.sender` is an address which has been previously approved view access in the `metaData` of a note. Secondly, that `msg.sender` still has view access to a note and has not since been revoked (by metaData being updated and not including this Ethereum address as an approved address).

### setProofs()
It should be noted that ZkAssets which are ownable and inherit from the `ZkAssetOwnable.sol` contract have a concept of 'supporting proofs'. The owner is able to choose which proofs the `ZkAsset` supports and can interact with. 

This is achieved through the `setProofs()` function, restricted to `onlyOwner`:

``` static solidity
function setProofs(
    uint8 _epoch,
    uint256 _proofs
) external onlyOwner {
    proofs[_epoch] = _proofs;
}
```

In order for a `ZkAsset` to be able to listen to and interact with a particular proof, it must be first registered with this function. 

By default, all `ZkAssetOwnable` contracts have the basic unilateral transfer `joinSplit` proof enabled in their constructor. 


## Types of ZkAssets
There are various types of `zkAsset`s, which are differentiated based on the flags `canAdjustSupply`, `canConvert` and whether or not the asset is ownable. 

`canAdjustSupply` determines whether the asset is able to mint or burn whilst `canConvert` determines whether public ERC20 tokens can be converted into AZTEC notes and vice versa. These flags are not exposed to the user instantiating the asset and are instead hardcoded into the constructor of the asset or derived from existing properties. `canAdjustSupply` is hardcoded into the constructor of the relevant asset, whilst `canConvert` is derived from whether a `linkedTokenAddress` was set in the asset's constructor.

These flags give rise to the contracts whose properties are summarised in the below table:

| Contract | canAdjustSupply | canConvert | Ownable |
| --- | --- | --- | --- |  
| ZkAsset | N | P | N |
| ZkAssetAdjustable | Y | P | N |
| ZkAssetMintable | Y | P | Y |
| ZkAssetBurnable | Y | P | Y |
| ZkAssetOwnable | N | P | Y |

where `Y` is yes, `N` no and `P` is possible (it is at the discretion of the instantiator). `ZkAssetMintable` is only able to mint, `ZkAssetBurnable` is only able to burn, whilst `ZkAssetAdjustable` is able to both mint and burn.
