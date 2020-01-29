# AZTEC Protocol 1.0.0 specification  

## Table of contents  
	-	Architecture
    -	The AZTEC Cryptography Engine
    -	AZTEC notes and ABI encoding
	-	The Note Registry
	-	ACE, the AZTEC Cryptography Engine
    -	Validating AZTEC proofs - defining the proof's identifier
    -	Enacting confidential transfer instructions - defining the ABI encoding of proofOutputs
    -	ABI encoding for bytes proofOutputs
    -	ABI encoding for bytes proofOutput = proofOutputs[i]
    -	Cataloguing valid proofs inside ACE
    -	ACE owner
	-	The key responsibilities of ACE
	  -	Separating proof validation and note registry interactions
	-	Contract Interactions
    -	Zero-knowledge dApp contract interaction, an example flow with bilateral swaps
    -	The rationale behind multilateral confidential transactions
	-	Validating an AZTEC proof
	-	Note registry implementation
    -	Creating a note registry
    -	Note Registry Variables
    -	Implementation and upgradeability
    -	How an upgrade works
    -	Current note registry versions
	-	Processing a transfer instruction
  	-	A note on ERC20 token transfers
	-	Minting AZTEC notes
	  -	Minting and tokens
	-	Burning AZTEC notes
	-	Interacting with ACE: zkAsset
	  -	Creating a confidential asset
    -	Issuing a confidential transaction: confidentialTransfer
    -	Issuing delegated confidential transactions: confidentialTransferFrom
    -	Permissioning
    -	Types of ZkAasset
	-	Account Registry
	-	Proof verification contracts
    -	JoinSplit.sol
    -	Swap.sol
    -	Dividend.sol
    -	PublicRange.sol
    -	PrivateRange.sol
    -	JoinSplitFluid.sol
	-	Specification of Utility libraries
	-	Appendix
    -	A: Preventing collisions and front-running
    -	B - Interest streaming via AZTEC notes
	-	Glossary


# Architecture  

The AZTEC protocol enables efficient confidential transactions through the construction of AZTEC-compatible zero-knowledge proofs. Specifically, the protocol focuses on optimizing confidential *settlement* and other forms of value-transfer

The protocol is architected to optimize for the following factors:  

1. customizability - AZTEC assets must have confidential transaction semantics that can be modified to suit the ends of the user  
2. interoperability - different AZTEC assets must conform to a standard interface that dApps can use to settle confidential transactions  
3. efficiency - no redundant computation should be performed when verifying confidential transactions  
4. qualified upgradability - as improvements are made to the underlying cryptographic protocols, and additional proof systems are added into AZTEC, existing confidential assets should be able to enjoy the benefits of these improvements. At the same time, users of AZTEC must be able to have confidence that they can opt out of these upgrades - that the verification algorithms used to validate existing zero-knowledge proofs are immutable. In addition, as upgrades are made to the logic of note registries, user must have the option to benefit from these upgrades whilst also being able to opt out.
## The AZTEC Cryptography Engine  

The focus of our protocol is this cryptography engine (ACE.sol). ACE is the ultimate arbiter of the correctness of an AZTEC zero-knowledge proof. AZTEC assets subscribe to ACE and call on it to validate proofs.  

ACE converts zero-knowledge proof data into *instructions* - directions on the following:  

1. AZTEC notes to be created  
2. AZTEC notes to be destroyed  
3. Public tokens that need to be transferred  

Internally, ACE will create a unique representation of each proof instruction and store it  

## ABI encoding and AZTEC data 'types'  

The nature of zero-knowledge cryptography means that a significant volume of data is processed on-chain in the form of zero-knowlege proof *inputs* and zero-knowledge proof *outputs*.  

Because using structs in external functions is still an experimental feature, the AZTEC protocol defines its own ABI encoding for struct-like data types. These objects are represented by the `bytes` type, where the contents of the bytes array contains data that is formatted according to the AZTEC protocol's ABI specification.  

### AZTEC note ABI

One key feature of ACE is the ability to support multiple note 'types'. Different note types enable the engine to support zero-knowledge proofs that use different techniques to represent encrypted value.

For example, the currently implemented basic AZTEC note is the most efficient way to represent encrypted value, however it's UTXO-like form may be unsuitable for some applications. On the other hand, once implemented, ElGamal 'treasury' notes could be used to emulate a more traditional account-balance model, where the balance is encrypted.

All notes use the same basic structure, but with different publicKey values. Every AZTEC zero-knowlege proof explicitly defines the type of note that it utilizes. Under no circumstances should it be possible to use a note of the wrong 'type' in a zero-knowledge proof.

The ABI encoding of a note is as follows:

| Offset | Length | Name | Type | Description|
| ------ | ------ | -------- | --- | --- |
| 0x00   | 0x20   | id | uint256 | The 'type' identifier of the note |
| 0x20   | 0x20   | owner | address | Ethereum address of note owner |
| 0x40   | 0x60   | noteHash | bytes32 | Hash of the note's elliptic curve points: gamma and sigma |
| 0x60   | L_pub   | publicKey | bytes | The public key of the note, that is used to encrypt value |  
| 0x60 + L_pub | L_met | metaData | bytes | Note-specific metaData |

### Type 1: UTXO notes  

This is the default note type and currently used by the protocol. The ABI formatting of this note's `publicKey` is as follows:

| Offset | Length | Name | Type | Description|
| ------ | ------ | -------- | --- | --- |
| 0x00   | 0x20   | gamma | bytes32 | (compressed) bn128 group element |
| 0x20   | 0x20   | sigma | bytes32 | (compressed) bn128 group element |
| 0x40   | 0x21   | ephemeral key | bytes33 | ephemeral public key used to recover viewing key |  

### Type 2: El-Gamal treasury notes  

Treasury notes would enable a single 'account' to have their balance represented by a single treasury note (instead of a multitude of AZTEC UTXO-type notes). They are slightly more gas-expensive to use than AZTEC notes and are only used in a small subset of AZTEC zero-kowledge proofs.

| Offset | Length | Name | Type | Description|
| ------ | ------ | -------- | --- | --- |
| 0x00   | 0x20   | ownerPubKey | bytes32 | (compressed) bn128 group element that maps to the public key of the note's owner |
| 0x20   | 0x20   | noteEphemeralKey | bytes32 | (compressed) bn128 group element, a public key component of the note's ephemeral key |
| 0x40 | 0x20 | noteCommitment | bytes32 | (compressed) bn128 group element, the core El-Gamal commitment |
| 0x60   | -      | metaData | bytes | custom metaData associated with note |  

### metaData
`metaData` is a general purpose data field for notes. It is not used by the logic of AZTEC zero-knowlege proof validators, but instead contains implementation and application specific information that is broadcast by events involving a note.

The metaData schema has a default component and then an additional `customData` component that can be set if the associated functionality is required. By default, it is populated with the ephemeral key which can be used to recover a note viewing key (see below). Additional custom data can be appended by calling `note.setMetaData()`, which in the current AZTEC implementation allows: encrypted viewing keys, addresses approved to view the note and arbitrary app data to be appended. This results in a schema as below:

| Offset | Length | Name | Type | Description |  
| --- | --- | --- | --- | --- |  
| 0x00 | 0x21 | ephemeral key | bytes32 | ephemeral key used in key exchange |  
| 0x21 | 0x20 | approvedAddressesOffset | uint256 | relative offset to `address[] approvedAddresses`|  
| 0x41 | 0x20 | encryptedViewKeysOffset | uint256 | relative offset to `bytes[] encryptedViewKeys` |  
| 0x61 | 0x20 | appDataOffset | int256 | relative offset to `bytes[] appData` |  
| 0x81 | L_addresses | approvedAddresses | address[] | addresses approved for access to viewing key |  
| 0xa1 + L_addresses | L_encryptedViewKeys | encryptedViewKeys | bytes[] | encrypted viewing keys, for each address |  
| 0xa1 + L_addresses + L_encryptedViewKeys | L_appData | appData | bytes[] | application specific data |  

These various types of additional information are used to enable functionality which is described below and relies on an additional AZTEC package - `note-access` - to generate it.


#### Use 1: Recovering note viewing key using the ephemeral key
The `metaData` by default stores for every note an 'ephemeral' public key. This can be used by the `noteOwner` to derive the vieiwng key for their note and so be able to decrypt their note. 

The requirement of storing the 'ephemeral' key arises from the fact that each note viewing key is distinct, however it is also desirable that users should not have to manage a multitude of unique viewing keys. As well as this, if user A wishes to send user B a note, they should be able to derive a viewing key that A can recover and the process should be non-interactive.

The solution is to use a shared secret protocol, between an 'ephemeral' public/private key pair and the public key of the note owner. An extension of this protocol can be used to derive 'stealth' addresses, if the recipient has a stealth wallet. Currently, our V1 APIs use the basic shared secret protocol for ease of use (traditional Ethereum wallets can own these kinds of AZTEC notes). At the smart contract level, the protocol is forward-compatible with stealth addresses.

#### Use 2: Granting view key access
The `approvedAddresses` and `encryptedViewKeys` part of the `metaData` originates from a requirement of `noteOwner`s being able to grant third parties view access to their notes. 

The `approvedAddress` is an Ethereum address that is being granted view access, and the `encryptedViewKey` is the note's viewing key which has been encrypted using the public key of the `approvedAddress`. This makes it possible for the intended `approvedAddress` to decrypt the viewing key of the note (the `metaData` is broadcast on chain), and so able to view the note value. 

It should be noted that this is also the principle method by which `noteOwner`s are granted access to their viewing key, rather than the ephemeral key method. This technique is computationally efficient, whereas computing a viewing key from an `ephemeralKey` can take 10s of seconds.

A function exists on the `ZkAsset` contract to support the granting of view key access via this method - `zkAsset.updateNoteMetaData(bytes32 noteHash, bytes calldata metaData)`. This allows the `metaData` of an already existing note to be updated, and so grant viewing key access to additional parties. 

##### How the grant view access metaData is generated
Generating `encryptedViewKeys`, `approvedAddresses` and formatting them into the required schema is performed by an AZTEC helper module called `note-access`. 

This helper module exposes a key method `generateAccessMetaData()`:

```
/**
 * @method generateAccessMetaData - grant an Ethereum address view access to a note
 * @param {Array} access - mapping between an Ethereum address and the linked public key. The specified address
 * is being granted access to the note
 * @param {String} noteViewKey - viewing key of the note
 */
export default function generateAccessMetaData(access, noteViewKey) {
    const noteAccess = access.map(({ address, linkedPublicKey }) => {
        const viewingKey = encryptedViewingKey(linkedPublicKey, noteViewKey);
        return {
            address,
            viewingKey: viewingKey.toHexString(),
        };
    });
    return addAccess('', noteAccess);
}
```

As inputs it takes an `access` object and the `noteViewKey`. The `access` object is used to define which Ethereum addresses are to be given view access to the note. The actual encryption is performed using the `tweetnacl` library: https://www.npmjs.com/package/tweetnacl, which itself makes use of elliptic curve Diffie-Hellman key exchange over Curve25519-XSalsa20-Poly1305.

The `generateAccessMetaData()` function is itself called on the `Note` class via the method:

```
/**
 * Grant an Ethereum address access to the viewing key of a note
 *
 * @param {Array} access mapping between an Ethereum address and the linked publickey
 * @returns {string} customData - customMetaData which will grant the specified Ethereum address(s)
 * access to a note
 */
grantViewAccess(access) {
    const noteViewKey = this.getView();
    const metaData = generateAccessMetaData(access, noteViewKey);
    this.setMetaData(metaData);
}
```

#### Use 3: Application specific data
Lastly, application specific data can be attached to the `metaData` of a note. This gives digital asset builders the option to attach custom data to an AZTEC note for an application specific utility. 

# The Note Registry  

The AZTEC note registry contract is a subset of the AZTEC Cryptography Engine, but we describe it explicitly given its importance to the protocol.  

The note registry contains the storage variables that define the set of valid AZTEC notes for a given address. It is expected this address maps to a smart contract, but this is not enforced.  

The note registry enacts the instructions generated by valid AZTEC proofs - creating and destroying the required notes, as well as transferring any required tokens.  

The note registry's `owner` is the only entity that can issue instructions to update the registry. `NoteRegistry` will only enact instructions that have been generated by a valid AZTEC proof as it is of critical importance that notes are not created/destroyed unless a **balancing relationship** has been satisfied.  

Because every confidential asset that uses an ACE note registry can have 100% confidence in the integrity of the state of every *other* ACE note registry, it makes it possible to express AZTEC notes from one registry as a percentage of notes in a second registry, which in turn is useful for dividend-paying confidential assets and confidential assets that utilize income streaming.

# ACE, the AZTEC Cryptography Engine

The ACE.sol contract is responsible for validating the set of AZTEC zero-knowledge proofs and performing any transfer instructions involving AZTEC notes. ACE is the controller of all AZTEC note registries and acts as the custodian of both AZTEC notes and any tokens that have been converted into AZTEC notes.

While it is possible to define note registries that are external to ACE, the state of these contract's note registries cannot be guranteed and only a subset of proofs will be usable (i.e. if an asset uses an ACE note registry, transfer instructions from AZTEC proofs that involve multiple note registries are only enacted if every note registry is controlled by ACE).

The ACE has the following interface:
```
/**
 * @title IACE
 * @author AZTEC
 * @dev Standard defining the interface for ACE.sol
 * Copyright Spilsbury Holdings Ltd 2019. All rights reserved.
 **/
interface IACE {

    function mint(
        uint24 _proof,
        bytes calldata _proofData,
        address _proofSender
    ) external returns (bytes memory);

    function burn(
        uint24 _proof,
        bytes calldata _proofData,
        address _proofSender
    ) external returns (bytes memory);

    function validateProof(uint24 _proof, address _sender, bytes calldata) external returns (bytes memory);

    function clearProofByHashes(uint24 _proof, bytes32[] calldata _proofHashes) external;

    function setCommonReferenceString(bytes32[6] calldata _commonReferenceString) external;

    function invalidateProof(uint24 _proof) external;

    function validateProofByHash(
        uint24 _proof,
        bytes32 _proofHash,
        address _sender
    ) external view returns (bool);

    function setProof(
        uint24 _proof,
        address _validatorAddress
    ) external;

    function incrementLatestEpoch() external;

    function getCommonReferenceString() external view returns (bytes32[6] memory);

    function getValidatorAddress(uint24 _proof) external view returns (address validatorAddress);

    function getNote(address _registryOwner, bytes32 _noteHash) external view returns (
        uint8 status,
        uint40 createdOn,
        uint40 destroyedOn,
        address noteOwner
    );
}
```

## Validating AZTEC proofs - defining the proof's identifier  

ACE supports multiple types of zero-knowlege proof and this family of proofs will grow over time. It is important to categorise these proofs in a systematic manner.  

The ACE proof identification and versioning sytem has the following characteristics:

* Extendibility. AZTEC's modular proof system enables composable confidential transaction semantics - adding more proofs enables these semantics to be more expressive. Additionally, it allows the AZTEC protocol to support fundamentally new types of zero-knowledge proving technology as Ethereum scales (e.g. bulletproofs, zk-snarks)
* Opt-out functionality. If an asset controller only wants to listen to a subset of proofs (e.g. whether to listen to newly added proofs is on their terms. This is important for assets that have an internal review process for zero-knowledge proofs)  
* Qualified immutability. The validator code for a given proof id should never change. AZTEC must be able to de-activate a proof if it is later found to contain a bug, but any upgrades or improvement to a proof are expressed by instantiating a new validator contract, with a new proof id.  

A proof is uniquely defined by an identifier`uint24 _proof`. ACE stores a mapping that maps each `_proof` to the address of a smart contract that validates the zero-knowledge proof in question.  

Instead of having a 'universal' validation smart contract, it was chosen to make these contracts discrete for maximum flexibility. Validator contracts should not be upgradable, to gurantee that users of AZTEC proofs can have confidence that the proofs they are using are not subject to change. Upgrades and changes are implemented by adding new validator contracts and new proofs.  

The `uint24 _proof` variable contains the concatenation of three `uint8` variables (the rationale for this compression is to both reduce `calldata` size and to simplify the interface. Our javascript APIs automatically compose proofs with the correct `_proof`, minimizing the amount of variables that a builder on AZTEC has to keep track of.

The formatting as follows (from most significant byte to least significant byte)

| name | type | description |
| --- | --- | --- |
| epoch | uint8 | the broad family that this proof belongs to |
| category | uint8 | the general function of this proof |
| id | uint8 | the proof's identifier, for the specified category and epoch |  

A semantic-style version system was not used because proof `epoch` defines functionality as well as a form of version control. Proofs with the same `uint8 id` but with different `uint8 epoch` do not neccesarily perform the same function and proofs from a later `epoch` are not strictly 'better' than proofs from an earlier `epoch`.  

For example, if the basic family of AZTEC proofs was adapted for confidential transactions that do not use a trusted setup, these proofs would be categorized by a new `epoch`. However these would not be a strict upgrade over the earlier epoch because the gas costs to verify these proofs would be almost an order of magnitude greater.  

Similarly, when confidential voting mechanics are implemented into `ACE`, these will be defined by a separate `epoch` to emphasise their different functionality vs confidential transactions.

The `uint8 category` variable represents an enum with the four following values:  

| value | name | description |
| --- | --- | --- |  
| 0x01 | BALANCED | proofs that satisfy a balancing relationship |  
| 0x02 | MINT | proofs that can be used to mint AZTEC notes |  
| 0x03 | BURN | proofs that can be used to burn AZTEC notes |  
| 0x04 | UTILITY | utility proofs that can not, in isolation, be used to issue note transfers |  

The `ACE` contract has separate logic to handle `BALANCED`, `MINT` and `BURN` proofs, as the latter two expressly violate the balancing relationship used to prevent double spending. The `MINT` and `BURN` proofs are designed for fully private AZTEC assets, ones with no ERC20 token equivalent, where AZTEC notes are the primary expression of value. Additional restrictions are placed on their use because of this. 

For more information regarding minting and burning, see the [mint](#minting-aztec-notes) and [burn](#burning-aztec-notes) section.

The `UTILITY` proofs are designed for assets that require additional validation logic before a transaction can be performed. For example, an asset might require a trader to prove that they own less than 10% of the total supply of the asset before a trade is processed. This is supported by our `dividend` utility proof.  

This specification contains [descriptions](#aztec-verifiers-joinsplitsol) for every currently supported proof id. Formal descriptions of the zero-knowledge proofs utilized by the verifiers can be found in the [AZTEC protocol paper](http://www.github.com/AZTECProtocol/AZTEC).

When combined together, `uint8 epoch, uint8 category, uint8 id` create 65025 unique proof identifies for each category. Given the complexity of zero-knowledge cryptographic protocols and the validation that must be performed before integration into `ACE`, it is infeasible for there to ever be demand for more than `65025` types of zero-knowledge proof inside `ACE`.

## Enacting confidential transfer instructions - defining the ABI encoding of proofOutputs

There is substantial variation between the zero-knowledge proofs that AZTEC utilizes. Because of this, and the desire to create a simple interface to validate proofs, the interface for proof *inputs* is generic. An AZTEC proof accepts three parameters: `bytes data, address sender, uint256[6] commonReferenceString`. The `commonReferenceString` is provided by ACE. The `data` variable contains the zero-knowledge proof data in question, the `address sender` field is utilized to [eliminate front-running](#a-preventing-collisions-and-front-running). The ABI-encoding of `bytes data` is specific to a given validator smart contract.

The **output** of a zero-knowledge proof is a list of instructions to be performed. It is important that these `proofOutput` variables conform to a common standard so that existing confidential assets can benefit from the addition of future proofs.  

An instruction must contain the following:  

* A list of the notes to be destroyed, the 'input notes'  
* A list of the notes to be created, the 'output notes'  
* If public tokens are being transferred, how many tokens are involved, who is the beneficiary and what is the direction of the transfer? (into ACE or out of ACE?)  

In addition to this, ACE must support one zero-knowledge proof producing *multiple* instructions (e.g. the `Swap` proof provides transfer instructions for two distinct assets).  

Proofs in the `UTILITY` category also conform to this specification, although in this context 'input' and 'output' notes are not created or destroyed.  

To summarise, the output of any AZTEC validator smart contract is a `bytes proofOutputs` variable, that encodes a dynamic array of `bytes proofOutput` objects. The ABI encoding is as follows:  

## ABI encoding for `bytes proofOutputs`

| Offset | Length | Name | Type | Description |  
| --- | --- | --- | --- | --- |  
| 0x00 | 0x20 | length | uint256 | the number of `proofOutput` objects |  
| 0x20 | (0x20 * length) | offsets | uint256[length] | array of 0x20-sized variables that contain the relative offset to each respective `proofOutput` object |  
| 0x20 + (0x20 * length) + (\sum_{j=0}^{i-1}L[j]) | L[i] | proofOutput[i] | bytes | the `bytes proofOutput` object |  

## ABI encoding for `bytes proofOutput = proofOutputs[i]`  

| Offset | Length | Name | Type | Description |  
| --- | --- | --- | --- | --- |  
| 0x00 | 0x20 | inputsOffset | uint256 | the relative offset to `bytes inputNotes` |  
| 0x20 | 0x20 | outputsOffset | uint256 | the relative offset to `bytes outputNotes` |  
| 0x40 | 0x20 | publicOwner | address | the Ethereum address of the owner of tokens being transferred |  
| 0x60 | 0x20 | publicValue | int256 | the amount of public 'value' being transferred |  
| 0x80 | 0x20 | challenge | uint256 | the 'challenge' variable used in the zero-knowledge proof that produced this output |  
| 0xa0 | L_1 | inputNotes | bytes | the `bytes inputNotes` variable |  
| 0xa0 + L_1 | L_2 | outputNotes | bytes | the `bytes outputNotes` variable |  

Both `bytes inputNotes` and `bytes outputNotes` are dynamic arrays of AZTEC notes, encoded according to the AZTEC note ABI spec.  

The `int256 publicValue` variable is a *signed* integer, because negative values are interpreted as tokens being transferred *from* `address publicOwner` and into `ACE`. Similarly, positive values are interpreted as tokens being transferred *to* `address publicOwner`.  

It should be noted that `int256 publicValue` does not represent an absolute number of tokens. Each registry inside `NoteRegistry` has an associated `uint256 scalingFactor`, that defines how many ERC20 tokens are represented by 1 unit of AZTEC note 'value'. This mapping is neccessary because AZTEC note values are approximately 30-bit integers (CAVEAT HERE) and a scaling factor is required to map 256-bit ERC20 token volumes to 30-bit AZTEC values.  

The `uint256 challenge` variable is used to ensure that each `bytes proofOutput` produces a unique hash. The challenge variable is required for every AZTEC zero-knowledge proof, and is itself a unique pseudorandom identifier for the proof (two satisfying zero-knowledge proofs cannot produce matching challenge variables without a hash collision).  For a proof that produces multiple `bytes proofOutput` entries inside `bytes proofOutputs`, it is the responsibility of the verifier smart contract to ensure each challenge variable is unique (i.e. each `bytes proofOutput` contains a challenge variable that is a hash of the challenge variable for the previous entry).

Consequently, a hash of `bytes proofOutput` creates a unique identifier for a proof instruction because of the uniqueness of the challenge variable.  

## Cataloguing valid proofs inside ACE  

Once a `BALANCED`, `MINT` or `BURN` proof has been validated, ACE records this fact so that future transactions can query the proof in question. This is done by creating a keccak256 hash of the following variables (encoded in an unpacked form)  

| Offset | Length | Name | Type | Description |  
| --- | --- | --- | --- | --- |  
| 0x00 | 0x20 | proofHash | bytes32 | a keccak256 hash of `bytes proofOutput` |  
| 0x20 | 0x20 | _proof | uint24 | the _proof of the proof |  
| 0x40 | 0x20 | msg.sender | address | the address of the entity calling `ACE` |  

This creates a unique key, that is mapped to `true` if the proof is valid (invalid proofs are not stored).  

Contracts can query `ACE` with a `bytes proofOutput`, combined with a `uint24 _proof` and the `address` of the entity that issued the instruction. `ACE` can validate whether this instruction came from a valid proof.  

This mechanism enables smart contracts to issue transfer instructions on behalf of both users and other smart contracts, enabling zero-knowledge confidential dApps. 

## ACE owner
It should be noted that upon deployment, the owner of the ACE will be a multi-signature wallet. The multi-sig wallet used is defined here: https://github.com/AztecProtocol/AZTEC/blob/develop/packages/protocol/contracts/MultiSig/MultiSigWalletWithTimeLock.sol

# The key responsibilities of `ACE`  

The `ACE` engine has two critical responsibilities:  

1. Determine the correctness of valid AZTEC zero-knowledge proofs and permanently record the existence of validated `BALANCED` proofs  
2. Update the state of its note registries when presented with valid transfer instructions

When processing a transfer instruction, the following criteria must be met:  

* Did the transfer instruction originate from the note registry's owner?  
* Is the transfer instruction sourced from a *mathematically legitimate* AZTEC proof?  

Because of these dual responsibilities, valid AZTEC proofs are *not* catalogued against specific note registries. The outputs of any valid proof can, theoretically, be issued to any note ,registry. After all, the existence of a valid proof indicates the resulting transfer instructions are balanced. This is the critical property that `ACE` *must* ensure, that all of its note registries are balanced and that there is no double spending.  
  
Restricting note registry updates to the creator of a given note registry provides a natural separation of concerns - `ACE` determines whether a transfer instruction *can* happen and the note registry owner determines whether the instruction *should* happen.  

### Separating proof validation and note registry interactions  

Because of these dual responsibilities, it might seem intuitive to roll proof validation and note registry updates into a single function. However, this would undermine one of the key strengths of the AZTEC protocol - that third party dApps can validate zero-knowledge proofs and send the resulting transfer instructions to AZTEC-compatible confidential assets. [Zero-knowledge dApp contract interaction, an example flow with bilateral swaps] (#zero-knowledge-dapp-contract-interaction-an-example-flow-with-Swaps) demonstrates this type of interaction and, consequently, the importance of separating proof validation from note registry updates.

# Contract Interactions  

![user-to-validator](https://github.com/CreditMint/wiki/blob/master/userToValidator.png?raw=true)  

Transaction #1  

1. `ACE.validateProof(uint24 _proof, address sender, bytes data)`  
2. `Validator.validate(bytes data, address sender, uint[6] commonReferenceString)` (revert on failure, return `bytes proofOutputs`)  
3. return `bytes proofOutputs` to `ACE`, revert on failure  
4. return `bytes proofOutputs` to caller, log valid proof if category != `UTILITY`, revert on failure  

![user-to-registry](https://i.imgur.com/V0gE6p3.jpg)

Transaction #1  

1. `ACE.updateNoteRegistry(uint24 _proof, bytes proofOutput, address sender)`  
2. `NoteRegistry.validateProofByHash(uint24 _proof, bytes proofOutput, address sender)` (revert on failure)
3. return `address publicOwner, uint256 transferValue, int256 publicValue` to ACE, if `int256 publicValue` is non-zero, `ACE.transferPublicTokens(address _publicOwner, uint256 _transferValue, int256 _publicValue, bytes32 _proofHash)` (revert on failure)
4a. (if `proofOutput.publicValue > 0`) `ERC20.transfer(proofOutput.publicOwner, uint256(proofOutput.publicValue))` (revert on failure)
4b. (if `proofOutput.publicValue < 0`) `ERC20.transferFrom(proofOutput.publicOwner, this, uint256(-proofOutput.publicValue))` (revert on failure)  
5. ACE: (revert on failure)  

## Zero-knowledge dApp contract interaction, an example flow with bilateral swaps  

The following image depicts the flow of a zero-knowledge dApp that utilizes the `Swap` proof to issue transfer instructions to two zkAsset confidential digital assets. This example aims to illustrate the kind of confidential cross-asset interactions that are possible with AZTEC. Later iterations of the protocol will include proofs that enable similar multilateral flows.  

The dApp-to-zkAsset interactions are identical for both `zkAsset A` and `zkAsset B`. To simplify the description we only describe the interactions for one of these two assets.

![zk-dapp-flow](https://github.com/CreditMint/wiki/blob/master/zkDappFlow2.png?raw=true)  

### (1-5) : Validating the proof  

1. `zk dApp` receives a `Swap` zero-knowledge proof from `caller` (with a defined `uint24 _proof` and `bytes data`.  

2. The `zk-dApp` contract queries `ACE` to validate the received proof,  via `ACE.validateProof(_proof, msg.sender, data)`. If `_proof` is not supported by `zk-dApp` the transaction will `revert`.

3. On receipt of a valid proof, `ACE` will identify the `validator` smart contract associated with `_proof` (in this case, `Swap.sol`). `ACE` will then call `validator.validateProof(data, sender, commonReferenceString)`. If the `_proof` provided does not map to a valid `validator` smart contract, the transaction will `revert`.

4. If the proof is valid, the `validator` contract will return a `bytes proofOutputs` object to `ACE`. If the proof is invalid, the transaction will `revert`.  

5. On receipt of a valid `bytes proofOutputs`, `ACE` will examine `_proof` to determine if the proof is of the `BALANCED` category. If this is the case, `ACE` will iterate over each `bytes proofOutput` in `bytes proofOutputs`. For each `proofOutput`, the `bytes32 proofHash` is computed. A unique proof identifier, `bytes32 _proofIdentifier = keccak256(abi.encode(_proof, msg.sender, proofHash))`, is then computed. This is used as a key to log the existence of a valid proof - `validProofs[_proofIdentifier] = true`.  

Once this has been completed, `ACE` will return `bytes proofOutputs` to `zk-dApp`.

### (6-8): Issuing a transfer instruction to `zkAsset A`  

At this stage, `zk-dApp` is in posession of transfer instructions that result from a valid `Swap` proof, in the form of a `bytes proofOutputs` object received from `ACE`.  

For the `Swap` proof, there will be `2` entries inside `proofOutputs`, with each entry mapping to one of the two confidential assets - `zkAsset A` and `zkAsset B`.  

6. The `zk-dApp` contract issues a transfer instruction to `zkAsset A` via `zkAsset.confidentialTransferFrom(_proof, proofOutput)`.  

7. On receipt of `uint24 _proof, bytes proofOutput`. The `zkAsset A` contract validates that `_proof` is on the contract's proof whitlelist. If this is not the case, the transaction will `revert`.  

`zkAsset A` computes `bytes32 proofHash` and query `ACE` as to the legitimacy of the received instructions, via `ACE.validateProofByHash(_proof, proofHash, msg.sender)`.  

8. `ACE` queries its `validProofs` mapping to determine if a proof that produced `bytes proofOutput` was previously validated and return a boolean indicating whether this is the case.  

If no matching proof was previously validated by `ACE`, `zkAsset A` will `revert` the transaction.  

### (9-16): Processing the transfer instruction  

Having been provided with a valid `proofOutput` that satisfies a balancing relationship, `zkAsset A` will validate the following:  

* For every input `note`, is `approved[note.noteHash][msg.sender] == true`?  

If this is not the case, the transaction will `revert`.  

9. If all input notes have been `approved`, `zkAsset A` will instruct `ACE` to update its note registry according to the instructions in `proofOutput`, via `ACE.updateNoteRegistry(_proof, proofOutput, msg.sender)`.

10. On receipt of `bytes proofOutput`, `ACE` will also validate that the `proofOutput` instruction came from a valid zero-knowledge proof (and `revert` if this is not the case). Having been satisfied of the proof's correctness, `ACE` will instruct the note registry owned by `msg.sender` (`zkAsset A`) to process the transfer instruction.  

11. `NoteRegistry A` will validate the following is correct:  

* For every input `note`, is `note.noteHash` present inside the `registry`?  
* For every output `note`, is `note.noteHash` *not* present inside the `registry`?  

If `proofOutput.publicValue > 0`, the registry will call `erc20.transfer(proofOutput.publicOwner, uint256(proofOutput.publicValue))`.  

If `proofOutput.publicValue < 0`, the registry will call `erc20.transferFrom(proofOutput.publicOwner, this, uint256(-proofOutput.publicValue))`.  

12. If the resulting transfer instruction fails, the transaction is `reverted`, otherwise control is returned to `Note Registry A`  

13-15. If the transaction is successful, control is returned to `ACE`, followed by `zkAsset A` and `zk-dApp`.  

16. Following the successful completion of the confidential transfer (from both `zkAsset A` and `zkAsset B`), control is returned to `caller`. It is assumed that `zk-dApp` will emit relevant transfer events, according to the ERC-1724 confidential token standard.

## The rationale behind multilateral confidential transactions  

The above instruction demonstrates a practical confidential cross-asset settlement mechanism. Without `ACE`, a confidential digital asset could only process a transfer instruction after validating the instruction conforms to its own internal confidential transaction semantics, a process that would require validating a zero-knowledge proof.  

This would result in 3 distinct zero-knowledge proofs being validated (one each by `zk-dApp`, `zkAsset A`, `zkAsset B`). Because zero-knowledge proof validation is the overwhelming contributor to the cost of confidential transactions, this creates a severe obstacle to practical cross-asset confidential interactions.

However, by subscribing to `ACE` as the arbiter of valid proofs, these three smart contracts can work in concert to process a multilateral confidential transfer having validated only a single zero-knowledge proof (this is because the `Swap` proof produces transfer instructions that lead to two balancing relationships. Whilst `zkAsset A` and `zkAsset B` do not know this (the proof in question could have been added to `ACE` *after* the creation of these contracts), `ACE` does, and can act as the ultimate arbiter of whether a transfer instruction is valid or not.  

Whilst it may apear that this situation requires AZTEC-compatible assets to 'trust' that ACE will correctly validate proofs, it should be emphasized that `ACE` is a completely deterministic smart-contract whose code is fully available to be examined. No real-world trust (e.g. oracles or staking mechanisms) is required. The source of the guarantees around the correctness of AZTEC's confidential transactions come from its zero-knowledge proofs, all of which have the properties of completeness, soundness and honest-verifier zero-knowledge.

# Validating an AZTEC proof  

AZTEC zero-knowledge proofs can be validated via `ACE.validateProof(uint24 _proof, address sender, bytes calldata data) external returns (bytes memory proofOutputs)`.  

The `bytes data` uses a custom ABI encoding that is unique to each proof that AZTEC supports. It is intended that, if a contract requires data from a proof, that data is extracted from `bytes proofOutputs` and not the input data.  

If the `uint8 category` inside `_proof` is of type `BALANCED`, `ACE` will record the validity of the proof as a state variable inside `mapping(bytes32 => bool) validatedProofs`.  

If the proof is not valid, an error will be thrown. If the proof is valid, a `bytes proofOutputs` variable will be returned, describing the instructions to be performed to enact the proof. For `BALANCED` proofs, each individual `bytes proofOutput` variable inside `bytes proofOutputs` will satisfy a balancing relationship.  


# Note registry implementation
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

### ` canAdjustSupply`

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

```
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
- Store the storage variables which define the set of unspent notes
- Implement the delegation of calls to behaviour contracts via delegatecall(). In this way, note registry functionality on the behaviour contract is executed in the context of the calling proxy storage contract - allowing behaviour methods access to notes
- Point the proxy to an upgraded behaviour implementation. This functionality is protected by an authorisation mechanism
- Faciliate a possible change of admin

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

```
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
- Epoch - the version number
- Cryptosystem - the crypto system that the note registry is interfacing with
- Asset type - the type of asset that the note registry belongs to i.e. is it convertable, adjustable, various combinations of these

Each of these variables is represented by a `uint8`, which are then packed together into a `uint24` to give the unique factory ID. Epoch number can only ever increase and all newly deployed behaviours must be backwards compatible.

### Note registry manager - `NoteRegistryManager.sol`

The note registry manager is inherited by ACE. Its responsibilities include:
- Define the methods uses to deploy and upgrade registries
- Define the methods uses to enact state changes sent by the owner of a registry
- Manage the list of factories that are available

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

```
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

```
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
|-------|---------------------|------------------------------------------------------|
| 1     | Behaviour201907.sol | Base note registry behaviour implementation          |
| 2     | Behaviour201911.sol | Asset that is unavailable during slow release period |
| 3     | Behaviour201912.sol | Asset that is available during slow release period‌  |


# Processing a transfer instruction  

Once a proof instruction has been received (either through `ACE` or via a third party that validated a proof through `ACE`, for example a confidential decentralized exchange dApp), it can be processed by calling `ACE.updateNoteRegistry(uint24 _proof, bytes proofOutput, address sender)`.  

* If `msg.sender` has not registered a note registry inside `ACE`, the transaction will throw  
* If the the proof instruction was **not** sourced from a proof that `ACE` validated, the transaction will throw  
* If `validatedProofs[keccak256(abi.encode(_proof, sender, keccak256(proofOutput)))] == false`, the transaction will throw  

If the above criteria are satisfied, the instruction is passed to `NoteRegistry`, where the following checks are validated against:  

* If any note in `proofOutput.inputNotes` does not hash to a key that does not exist inside `noteRegistry`, the transaction will throw  
* If any note in `proofOutput.outputNotes` hashes to a key that *already* exists inside `noteRegistry`, the transaction will throw  
* If `proofOutput.publicValue != 0` and the asset is not `mixed`, the transaction will throw  

Once these conditions have been satisfied, every note in `proofOutput.inputNotes` is destroyed, and every note in `proofOutput.outputNotes` is created.  

Additionally, if `proofOutput.publicValue < 0`, `linkedToken.transferFrom(proofOutput.publicOwner, this, uint256(-proofOutput.publicValue))` is called. If this call fails, the transaction will throw.  
If `proofOutput.publicValue > 0`, `linkedToken.transfer(proofOutput.publicOwner, uint256(proofOutput.publicValue))` will be called. If this call fails, the transaction will throw.  

### A note on ERC20 token transfers  

For `mixed` assets, if tokens are withdrawn from AZTEC then, from the balancing relationships checked by AZTEC's zero-knowledge proofs, `ACE` will always have a sufficient balance, as the only way to create AZTEC notes is by depositing tokens in the first place.  

For `mintable` assets that are also `mixed`, there are additional steps that a digital asset builder must implement. If an AZTEC note is directly minted, and then converted into tokens, `ACE` will not have a sufficient token balance to initiate the transfer. 

# Minting AZTEC notes  

Under certain circumstances, a digital asset owner may wish to directly mint AZTEC notes. One example is a confidential digital loan, where the loan originators create the initial loan register directly in the form of AZTEC notes.  

At the creation of a note registry, the registry owner can choose whether their registry is 'mintable' by setting `bool _canAdjustSupply` to `true` in `ACE.createNoteRegistry(address _linkedTokenAddress, uint256 _scalingFactor, bool _canAdjustSupply, bool _canConvert)`.  

A 'mintable' note registry has access to the `ACE.mint(uint24 __proof, bytes _proofData, address _proofSender)` function. This function will validate the proof defined by `__proof, _data, _proofSender` (and assert that this is a `MINTABLE` proof) and then immediately enact the produced `bytes proofOutput` at the note registry controlled by `msg.sender`.  

A `MINTABLE` proof follows a defined standard. The note registry contains a `bytes32 totalMinted` variable that is the hash of an AZTEC UTXO note that contains the total value of AZTEC notes that been minted by the registry owner.  

A `MINTABLE` proof will produce a `proofOutputs` object with two entries.  

* The first entry contains the old `confidentialTotalMinted` note and the new `confidentialTotalMinted` value  
* The second entry contains a list of notes that are to be minted  

If the `confidentialTotalMinted` value does not match the old `confidentialTotalMinted` value in `proofOutputs`, the transaction will revert.  

If all checks pass, the relevant AZTEC notes will be added to the note registry.  

## Minting and tokens  

Care should be taken if AZTEC notes are directly minted into an asset that can be converted into ERC20 tokens. It is possible that a conversion is attempted on a note and the token balance of the note registry in question is insufficient. Under these circumstances the transaction will revert. It is the responsibility of the note registry owner to provide `ACE` with sufficient tokens to enable such a transfer, as it falls far outside the remit of the Cryptography Engine to request minting priviledges for any given ERC20 token.  

This can be performed via `ACE.supplementTokens(uint256 _value)`, which will cause `ACE` to call `transferFrom` on the relevant ERC20 token, using `msg.sender` both as the transferee and the note registry owner. It is assumed that the private digital asset in question has ERC20 minting priviledges, if the note registry is also mintable.  

# Burning AZTEC notes

Burning is enacted in an identical fashion to note minting. The total amount of burned AZTEC notes is tracked by a `bytes32 confidentialTotalBurned` variable.  

Burn proofs follow a similar pattern - updating the `totalBurned` variable and destroying the specified AZTEC notes.  

It should be stressed that only a note registry owner, who has set the relevant permissions on their note registry, can call `ACE.mint` and `ACE.burn`.  

If ERC20 tokens have been converted into AZTEC notes, which are subsequently burned, the resulting tokens will be permanently locked inside `ACE` and will be unretrievable. Care should be taken by a note registry owner that this behaviour is desired when they burn notes.

# Interacting with ACE: zkAsset

The `zkAsset.sol` contract is an implementation of a confidential token, that follows the [EIP-1724 standard](https://github.com/ethereum/EIPs/issues/1724). It is designed as a template that confidential digital asset builders can follow, to create an AZTEC-compatible asset. All `ZkAssets` must follow the following minimum interface:
```
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

```
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

```
mapping(bytes32 => mapping(address => bool)) public confidentialApproved;
```

This mapping will later be checked when an attempt is made to spend the note. 

It should be noted that the `confidentialApprove()` interface is designed to facilitate stealth addresses. For a stealth address, it is unlikely that the address will have any Ethereum funds to pay for gas costs, and a meta-transaction style transaction is required. In this situation, `msg.sender` will not map to the owner of the note and so an ECDSA signatue is used.  

For other uses, such as a smart contract or a non-stealth address, a direct transaction sent by the correct `msg.sender` is possible by sending a null signature.

### approveProof()
This allows spending permission to be granted to multiple notes in a single atomic function call. This is useful for delegating note control over `n` notes in a single transaction, rather than having to make `n` `confidentialApprove()` calls.

The method has the following interface:

```
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

```
mapping(bytes32 => mapping(address => bool)) public confidentialApproved;
```

Later when this proof and associated notes are used in a `confidentialTransferFrom()` transaction, the `confidentialApproved` mapping is queried. Firstly, it is checked if:

```
confidentialApproved[proofHash][msg.sender] != true
```

If this is the case then the notes were approved for spending via the `approveProof()` method and the transaction proceeds. If this is not `true`, then for each `inputNote` (notes to be spent) the following is checked:

```
confidentialApproved[noteHash][msg.sender] == true
```



### Granting note view key access
AZTEC notes contain a `metaData` field, with a specification as outlined in the note ABI discussion. One of the principal uses of this data field, is to store encrypted viewing keys - to allow note view access to be granted to third parties. The `metaData` of a note is not stored in storage, rather it is emitted as an event along with the successful creation of a note:

```
emit CreateNote(noteOwner, noteHash, metadata);
```

It may be desirable to grant note view key access to parties, beyond those for which an encrypted viewing key was initially provided when the note was created. To facilitate this, the `ZkAssetBase.sol` has an `updateNoteMetaData()` method:

```
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
```
mapping(bytes32 => uint256) public noteAccess;
```

This is a mapping of `addressIDs` to a `uint256` , where the `uint256` is the `block.timestamp` of the block in which the particular address was originally granted approval via `approveAddresses()`.

We then compare `noteAccess[addressID]` to the value stored in `metaDataTimeLog[noteHash]`. `metaDataTimeLog` is a second mapping of the form:

```
mapping(bytes32 => uint256) public metaDataTimeLog;
```

It is a mapping of  `noteHash` to the `block.timestamp` when the method `setMetaDataTimeLog()` was last called. This mapping is used to keep track of when the metaData for a particular note was last updated. 

By checking that `noteAccess[addressID] >= metaDataTimeLog[noteHash]` we satisfy two conditions. Firstly, that `msg.sender` is an address which has been previously approved view access in the `metaData` of a note. Secondly, that `msg.sender` still has view access to a note and has not since been revoked (by metaData being updated and not including this Ethereum address as an approved address).

### setProofs()
It should be noted that ZkAssets which are ownable and inherit from the `ZkAssetOwnable.sol` contract have a concept of 'supporting proofs'. The owner is able to choose which proofs the `ZkAsset` supports and can interact with. 

This is achieved through the `setProofs()` function, restricted to `onlyOwner`:
```
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


# Account Registry
The `AccountRegistry` is a key smart contract in the AZTEC ecosystem that enables important implementation/application level features - it is not involved in the zero-knowledge proof systems. 

It enables two features:
1) User registration with AZTEC's SDK (software development kit)
2) Gasless meta-transactions via the GSN (gas station network)

The contract has also been made upgradeable, to allow new methods for the above functionality to be added and to allow the contract to evolve and potentially take on additional functionality in the future. The following sections firstly describe the role the `AccountRegistry` contract plays in enabling the above features, as well as explaining the upgrade mechanism it employs.  

The `AccountRegistry.sol` contract has the following interface:

```
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
```
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

```
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

```
if (block.timestamp > maxTimestamp) {
    return _rejectRelayedCall(uint256(GSNRecipientSignatureErrorCodes.INVALID_TIMESTAMP), context);
}
```

griefing attacks are mitigated. 

`maxTimestamp` is currently set to approximately 2hrs - it is defined and stored on AZTEC servers.

##### `signature`
`signature` is produced using an AZTEC server private key. When a transaction is signed in the SDK using the users `PK`, it is then relayed to AWS. AWS stores the AZTEC server private key, which then signs the transaction object received. This action generates `signature`, which is then used in the permissioning as to which transactions are eligible to have their gas paid for. 

This permissioning works because the AZTEC server private key has a corresponding Ethereum address referred to as the `trustedSigner` or `_trustedGSNSignerAddress`. The `acceptRelayedCall()` method checks in the following segment that the transaction was indeed signed by the `trustedSigner`:

```
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

# Proof verification contracts
## JoinSplit.sol  

The `JoinSplit` contract validates the AZTEC join-split proof. It takes a series of inputNotes , to be removed from a note registry, and a series of outputNotes to be added to the note registry. In addition, an integer publicValue can be supplied - this specifies the number of ERC20 tokens to be converted into AZTEC note form or from AZTEC note form.   

The ABI of `bytes data` is the following:  

| offset | length | name | type | description |  
| --- | --- | --- | --- | --- |  
| 0x00 | 0x20 | m | uint256 | number of input notes |  
| 0x20 | 0x20 | challenge | uint256 | zero-knowledge proof challenge |  
| 0x40 | 0x20 | publicOwner | address | beneficiary of public tokens being used in proof |  
| 0x60 | 0x20 | notesOffset | uint256 | relative offset to `uint[6][] notes` |  
| 0x80 | 0x20 | inputOwnerOffset | uint256 | relative offset to `address[] inputOwners` |  
| 0xa0 | 0x20 | outputOwnersOffset | uint256 | relative offset to `address[] outputOwners` |  
| 0xc0 | 0x20 | notemetaDataOffset | uint256 | relative offset to `bytes[] notemetaData` |  
| 0xe0 | L_notes | notes | uint[6][] | zero-knowledge proof data for notes |  
| 0xe0 + L_notes | L_inputOwners | inputOwners | address[] | address of input note owners |  
| 0xe0 + L_notes + L_inputOwners | L_owners | outputOwners | address[] | address of output note owners |  
| 0xe0 + L_notes + L_inputOwners + L_owners | L_metaData | notemetaData | bytes[] | note metaData, used for event broadcasts |  

**`uint[6][] notes`** contains the zero-knowledge proof data required for the set of input and output UTXO notes used inside `JoinSplit`. The ABI encoding is as follows:  

| offset | length | name | type | description |  
| --- | --- | --- | --- | --- |  
| 0x00 | 0x20 | kBar | uint256 | blinded form of the note's value |  
| 0x20 | 0x20 | aBar | uint256 | blinded form of the note's viewing key |  
| 0x40 | 0x20 | gammaX | uint256 | x-coordinate of UTXO note point 'gamma' |  
| 0x60 | 0x20 | gammaY | uint256 | y-coordinate of UTXO note point 'gamma' |  
| 0x80 | 0x20 | sigmaX | uint256 | x-coordinate of UTXO note point 'sigma' |  
| 0xa0 | 0x20 | sigmaY | uint256 | y-coordinate of UTXO note point 'sigma' |  

The amount of public 'value' being used in the join-split proof, `kPublic`, is defined as the `kBar` value of the last entry in the `uint[6][] notes` array. This value is traditionally empty (the last note does not have a `kBar` parameter) and the space is re-used to house `kPublic`.
  
## Swap.sol  

The `Swap` contract validates a zero-knowledge proof that defines an exchange of notes between two counter-parties, an order *maker* and an order *taker*. 

The proof involves 4 AZTEC UTXO notes, and proves the following:

1. `note[0].value = note[2].value`  
2. `note[1].value = note[3].value`  

In this context, the notes are interpreted as the following:  

* `note[0]`: order maker bid note  
* `note[1]`: order maker ask note  
* `note[2]`: order taker ask note
* `note[3]`: order taker bid note  

This proof does not perform any authorization logic - it is the responsibility of the asset smart contracts involved in a trade to perform required permissioning checks.  

The ABI of `bytes data` is identical to the ABI-encoding of the `JoinSplit.sol` verification smart contract. The `Swap` contract will throw if `n != 4` or `m != 2`.  

Once a proof has been successfully validated, `bytes proofOutputs` will contain two entries, with the following note assignments:  

* `proofOutputs[0].inputNotes = [note[0]]`
* `proofOutputs[0].outputNotes = [note[2]]`  
* `proofOutputs[1].inputNotes = [note[3]]`
* `proofOutputs[1].outputNotes = [note[1]]`  

i.e. Both the order maker and order taker are destroying their *bid* notes in exchange for creating their *ask* notes.  

Each entry inside `proofOutputs` defines a balancing relationship. If `proofOutputs[0]` and `proofOutputs[1]` are sent to different ZKAsset smart contracts, this proof can be used to define a bilateral swap of AZTEC notes, between two counter-parties and across two asset classes.

The ABI of `bytes data` is the following:

| offset | length | name | type | description |  
| --- | --- | --- | --- | --- |  
| 0x00 | 0x20 | challenge | uint256 | zero-knowledge proof challenge |  
| 0x20 | 0x20 | notesOffset | uint256 | relative offset to `uint[6][] notes` |  
| 0x40 | 0x20 | inputOwnersOffset | uint256 | relative offset to `address[] inputOwners` |  
| 0x60 | 0x20 | outputOwnersOffset | uint256 | relative offset to `address[] outputOwners` |  
| 0x80 | 0x20 | notemetaDataOffset | uint256 | relative offset to `bytes[] notemetaData` |  
| 0xa0 | L_notes | notes | uint[6][] | zero-knowledge proof data for notes |  
| 0xe0 + L_notes | L_inputOwners | inputOwners | address[] | address of input note owners |  
| 0xa0 + L_notes + L_inputOwners | L_owners | outputOwners | address[] | address of output note owners |  
| 0xa0 + L_notes + L_inputOwners + L_owners | L_metaData | notemetaData | bytes[] | note metaData, used for event broadcasts |  

## Dividend.sol  

The `Dividend` proof validates that an AZTEC UTXO note is equal to a public percentage of a second AZTEC UTXO note. This proof is belongs to the `UTILITY` category, as in isolation it does not describe a balancing relationship.  

The `Dividend` proof involves three AZTEC notes and two scalars `za, zb`. The scalars `za, zb` define a ratio and the proof proves the following:  

* `note[1].value * za = note[2].value * zb + note[3].value`

In this context, `note[3]` is a **residual** note. The residual note is required in order to accommodate rounding errors. Consider the scenario of a user computing an interest rate payment for values `za, zb` that are fixed by a smart contract.

In this context, `zb > za` and `note[1].value` is the **source** note. The **target** note is `note[2]`. The owner of `note[1]` wishes to prove that `note[2].value = note[1].value * (za / zb)`, or as close as they can manage given the confines of integer arithmetic.  

As the value of `note[1]` is unknown to all but the note owner, they have a free choice in choosing values for `note[2]` and `note[3]`. However in order to maximize the value of `note[2]`, it is in the note owner's interest to minimize `note[3].value`.  

It is worth highlighting the fact that the `Dividend` proof, like all AZTEC proofs, it is impossible to present a satisfying proof if any notes have negative value.  

When utilizing the `Dividend` proof inside a smart contract, care should be taken to determine whether the proof is being utilized to validate a *debit* computation or a *credit* computation, as it important to ensure that the sender of the proof is incentivized to minimize the value of `note[3]` (not to maximize it).

In a *debit* computation, the note owner is proving that an AZTEC note correctly represents a transfer of value *from* the note owner. For example, a loan repayment. In this context, it is in the note owner's interest to *minimize* the value of the **target** note. It is therefore important to set `note[1]` as the **target** note and `note[2]` as the **source** note. Under this formulism, increasing `note[3].value` will also increase the value of the target note. The note owner, therefore, is incentivized to ensure that `note[3].value` is as small as possible. In this situation, malicious behaviour is prevented because of the AZTEC range proof: `note[3].value` cannot be negative.  

In a *credit* computation, the incentives are reversed and it is neccessary to set `note[1]` as the **source** note, and `note[2]` as the **target** note.  

Similarly to `Swap`, this proof performs no permissioning checks. It is the responsibliity of the smart contract invoking `Dividend` to imbue meaning into the notes being used in the proof, and to ensure that the correct permissioning flows have been observed.  

The ABI of `bytes data` is the following:

| offset | length | name | type | description |  
| --- | --- | --- | --- | --- |  
| 0x00 | 0x20 | challenge | uint256 | zero-knowledge proof challenge |  
| 0x20 | 0x20 | za | uint256 | dividend computation scalar |  
| 0x40 | 0x20 | zb | uint256 | dividend computation scalar |  
| 0x60 | 0x20 | notesOffset | uint256 | relative offset to `uint[6][] notes` |  
| 0x80 | 0x20 | inputOwnersOffset | uint256 | relative offset to `address[] inputOwners` |  
| 0xa0 | 0x20 | outputOwnersOffset | uint256 | relative offset to `address[] outputOwners` |  
| 0xc0 | 0x20 | notemetaDataOffset | uint256 | relative offset to `bytes[] notemetaData` |  
| 0xe0 | L_notes | notes | uint[6][] | zero-knowledge proof data for notes |  
| 0xe0 + L_notes | L_inputOwners | inputOwners | address[] | address of input note owners |  
| 0xe0 + L_notes + L_inputOwners | L_outputOwners | outputOwners | address[] | address of output note owners |  
| 0xe0 + L_notes + L_inputOwers + L_outputOwners | L_metaData | notemetaData | bytes[] | note metaData, used for event broadcasts |  

## PublicRange.sol  

The `PublicRange` proof validates in zero-knowledge that the value of one AZTEC note is greater than or equal to, or less than or equal to a public integer. It belongs to the `UTILITY` proof category. 

The proof involves three quantities:
- `originalNote` = note who's inequality relation we seek to prove
- `publicComparison` = public integer, which the `originalNote` is being compared against
- `utilityNote` = helper note, used to construct an appropriate proof relation

These quantities are then used to construct a proof relation:
`originalNoteValue = publicComparison + utilityNoteValue`.

In addition, a boolean `isGreaterOrEqual` is supplied to the proof. This is used to control whether the proof is for a greater than or equal to, or less than or equal to scenario. 

If `isGreaterOrEqual` is true, then it is a greater than or equal proof and `originalNoteValue >= publicComparison`. If `false`, it is a less than or equal to proof that `originalNoteValue <= publicComparison`. 

The ABI of `bytes data` is the following:

| offset | length | name | type | description |  
| --- | --- | --- | --- | --- |  
| 0x00 | 0x20 | challenge | uint256 | zero-knowledge proof challenge |  
| 0x20 | 0x20 | publicComparison | uint256 | public integer note value compared against |  
| 0x40 | 0x20 | notesOffset | uint256 | relative offset to `uint[6][] notes` |  
| 0x60 | 0x20 | inputOwnersOffset | uint256 | relative offset to `address[] inputOwners` |  
| 0x80 | 0x20 | outputOwnersOffset | uint256 | relative offset to `address[] outputOwners` |  
| 0xa0 | 0x20 | notemetaDataOffset | uint256 | relative offset to `bytes[] notemetaData` |  
| 0xc0 | L_notes | notes | uint[6][] | zero-knowledge proof data for notes |  
| 0xc0 + L_notes | L_inputOwners | inputOwners | address[] | address of input note owners |  
| 0xc0 + L_notes + L_inputOwners | L_outputOwners | outputOwners | address[] | address of output note owners |  
| 0xc0 + L_notes + L_inputOwers + L_outputOwners | L_metaData | notemetaData | bytes[] | note metaData, used for event broadcasts |  

## PrivateRange.sol  

The `PrivateRange` proof validates in zero-knowledge that the value of one AZTEC note is greater than or less than the value of a second AZTEC note. It belongs to the `UTILITY` proof category as no true balancing relationship is satisfied.

The proof involves three AZTEC notes:
- `originalNote` = note who's inequality relation we seek to prove
- `comparisonNote` = note being compared against
- `utilityNote` = helper note, used to construct an appropriate proof relation

These notes are used to construct the following proof relation: `originalNote.value = comparisonNote.value + utilityNote.value`

If this is satisfied, it means that `originalNote.value > comparisonNote.value`. Note, that the range proof means it is not possible to construct notes with a value less than zero. In order to construct a less than proof (i.e. `originalNote.value < comparisonNote.value`), the user must change the input order to show that `comparisonNote.value > originalNote.value`

The `proofOutputs` object returned contains one `proofOutput` object. The `inputNotes` corresponds to `originalNote` and `comparisonNote`, with the `outputNotes` corresponding to `utilityNote`. The output note has no physical meaning and is used to construct a mathematically appropriate proof relation.

The ABI of `bytes data` is the following:

| offset | length | name | type | description |  
| --- | --- | --- | --- | --- |  
| 0x00 | 0x20 | challenge | uint256 | zero-knowledge proof challenge |  
| 0x20 | 0x20 | notesOffset | uint256 | relative offset to `uint[6][] notes` |  
| 0x40 | 0x20 | inputOwnersOffset | uint256 | relative offset to `address[] inputOwners` |  
| 0x60 | 0x20 | outputOwnersOffset | uint256 | relative offset to `address[] outputOwners` |  
| 0x80 | 0x20 | notemetaDataOffset | uint256 | relative offset to `bytes[] notemetaData` |  
| 0xa0 | L_notes | notes | uint[6][] | zero-knowledge proof data for notes |  
| 0xa0 + L_notes | L_inputOwners | inputOwners | address[] | address of input note owners |  
| 0xa0 + L_notes + L_inputOwners | L_outputOwners | outputOwners | address[] | address of output note owners |  
| 0xa0 + L_notes + L_inputOwers + L_outputOwners | L_metaData | notemetaData | bytes[] | note metaData, used for event broadcasts |  


## JoinSplitFluid.sol  

The JoinSplitFluid contract enables proofs to be validated for the direct minting or burning of AZTEC notes, if `Registry.adjustSupply = true`. 

`Mint` and `burn` proofs are both special cases of the `joinSplit` proof - they are the `joinSplit` proof but they have a restricted, specified set of inputs. This validator contract is used to validate both `mint` and `burn` proofs. 

In the mint proof, notes are being directly created and added to a note registry, whilst in the burn proof notes are being removed from a note registry. In terms of notes, the joinSplitFluid validator takes three inputs:
- `currentCounterNote` - note that describes the existing total minted/burned value in this note registry
- `newCounterNote` - note that describes the new total minted/burned value in this note registry once the proof has been validated and the results enacted
- `minted/burned notes` - the notes that are to be minted and created in the note registry, or burned and removed from the note registry

The minted/burned notes are the notes being added or removed from the note registry. The purpose of the counter notes is to keep track of the total value that has been minted or burned in this note registry - this informatiom may be for accounting purposes, or an audit. 

It is important to note that for a given note registry, only the registry owner can call `ACE.mint` or `ACE.burn`. Only the registry owner must know the value of the total notes - hashes of these notes are represented by the registry variables `confidentialTotalMinted` and `confidentialTotalBurned`.

The ABI-encoding of `bytes data` is identical to that of an AZTEC `JoinSplit` transaction. There is the added restriction that `m = 1` and `n >= 2`.

When encoding bytes proofOutputs, the following mapping between input notes and notes in proofOutputs is used:

- `proofOutputs.length = 2`
- `proofOutputs[0].inputNotes = [currentCounterNote]`
- `proofOutputs[0].outputNotes = [newCounterNote]`
- `proofOutputs[0].publicOwner = address(0)`
- `proofOutputs[0].publicValue = 0`
- `proofOutputs[1].inputNotes = []`
- `proofOutputs[1].outputNotes = [minted/burned notes]`

The ABI of `bytes data` is the following:

| offset | length | name | type | description |  
| --- | --- | --- | --- | --- |  
| 0x00 | 0x20 | challenge | uint256 | zero-knowledge proof challenge |  
| 0x20 | 0x20 | notesOffset | uint256 | relative offset to `uint[6][] notes` |  
| 0x40 | 0x20 | inputOwnersOffset | uint256 | relative offset to `address[] inputOwners` |  
| 0x60 | 0x20 | outputOwnersOffset | uint256 | relative offset to `address[] outputOwners` |  
| 0x80 | 0x20 | notemetaDataOffset | uint256 | relative offset to `bytes[] notemetaData` |  
| 0xa0 | L_notes | notes | uint[6][] | zero-knowledge proof data for notes |  
| 0xa0 + L_notes | L_inputOwners | inputOwners | address[] | address of input note owners |  
| 0xa0 + L_notes + L_inputOwners | L_outputOwners | outputOwners | address[] | address of output note owners |  
| 0xa0 + L_notes + L_inputOwers + L_outputOwners | L_metaData | notemetaData | bytes[] | note metaData, used for event broadcasts |  


# Specification of Utility libraries  

There are various utility contracts/libraries that are used to make the protocol smart contract system more modulular and self documenting. These include:

- `LibEIP712.sol` - helpers for validating EIP712 signatures
- `MetaDataUtils.sol` - helpers for extracting Ethereum addresses from a note's metaData
- `Modifiers.sol` - base contract intended to define commonly used function modifiers. To be inherited by other contracts. Currently provides the `checkZeroAddress()` modifier
- `NoteUtils.sol` - helpers that extract user-readable information from proofOutputs. Detailed below.
- `ProofUtils.sol` - decompose a `uint24 proofId` into it's three constituent `uint8` components: epoch, category and id
- `SafeMath8.sol` - SafeMath operations for `uint8` variables
- `VersioningUtils.sol` - helper to extract the three constiutent `uint8` variables compressed into a `uint24`

## NoteUtils.sol  

A particularly useful utility library is `NoteUtils.sol` . This was built to abstract away the complexities of an AZTEC proof's ABI-encoding from a digital asset builder. It provides helper methods that enable data to be extracted from `bytes memory proofOutputs`:

### `NoteUtils.getLength(bytes memory proofOutputsOrNotes) internal pure returns (uint256 length)`  

When provided with an AZTEC ABI-encoded array (any one of `bytes memory proofOutputs, bytes memory inputNotes, bytes memory outputNotes`), this method will return the number of entries.  

### `NoteUtils.get(bytes memory proofOutputsOrNotes, uint256 i) internal pure returns (bytes memory out)`  

This method will return the `i`'th entry of an AZTEC ABI-encoded array. If `i` is an invalid index an error will be thrown.

### `NoteUtils.extractProofOutput(bytes memory proofOutput) internal pure returns (bytes memory inputNotes, bytes memory outputNotes, address publicOwner, int256 publicValue)`  

This method will extract the constituent members of `bytes proofOutput`.

### `NoteUtils.extractNote(bytes memory note) internal pure returns (address owner, bytes32 noteHash, bytes memory metaData)`  

This method will extract the constituent members of an AZTEC ABI-encoded note. Such as the notes contained inside `proofOutput.inputNotes` and `proofOutput.outputNotes`.

### `NoteUtils.getNoteType(bytes memory note) internal pure returns (uint256 noteType)`  

Extracting the 'type' of a note is provided as a separate method, as this is a rare requirement and its including inside `NoteUtils.extractNote` would bloat the number of stack variables required by the method.

There are in addition the following custom utilities libraries:
- ProofUtils.sol
- LibEIP712.sol
- VersioningUtils.sol

# Appendix 
## A: Preventing collisions and front-running  

For any AZTEC verification smart contract, the underlying zero-knowledge protocol must have a formal proof describing the protocol's completeness, soundness and honest-verifier zero-knowledge properties.  

In addition to this, and faithfully implementing the logic of the protocol inside a smart contract, steps must be undertaken to prevent 'proof collision', where a `bytes proofOutput` instruction from a proof has an identical structure to a `bytes proofOutput` instruction from a different smart contract verifier. This is done by integrating the `uint24 _proof` variable associated with that specific verification smart contract into the `uint256 challenge` variable contained in each `bytes proofOutput` entry.

Secondly, the front-running of proofs must be prevented. This is the act of taking a valid zero-knowledge proof that is inside the transaction pool but not yet mined, and integrating the proof into a malicious transaction for some purpose that is different to that of the transaction sender. This is achieved by integrating the message sender into challenge variable - it will not be possible for a malicious actor to modify such a proof to create a valid proof of their own construction, unless they know the secret witnesses used in the proof.  

Getting `msg.sender` into the verification contract is done by passing through this variable as an input argument from the contract that is calling `ACE.sol`. If this is not done correctly, the asset in question is susceptible to front-running. This does not expose any security risk for the protocol, as assets that correctly use ACE are not affected by assets that incorrectly implement the protocol.

## B - Interest streaming via AZTEC notes  

Consider a contract that accepts a DAI note (let's call it the origination note), and issues confidential Loan notes in exchange, where the sum of the values of the loan notes is equal to the sum of the values of the origination note (this is enforced).

When a deposit of confidential DAI is supplied to the contract in the form of an interest payment (call it an interest note), a ratio is defined between the value of the interest note and the origination note.  

The AZTEC Cryptography Engine supports a zero-knowledge proof that allows loan 'note' holders to stream value out of the interest note. Effectively printing zkDAI notes whose value is defined by the above ratio and the absolute value of their loan note. In exchange, the interest note is destroyed.  

What is important to highlight in this exchange, is that the zk-DAI contract is not having to make any assumptions about the zk-Loan contract, or trust in the correctness of the zk-Loan contract's logic.  

The zero-knowledge proofs in ACE enable the above exchange to occur with a gaurantee that there is no double spending. The above mechanism cannot be used to 'print' zk-DAI notes whose sum is greater than the interest note. `NoteRegistry` and `ACE` only validate the mathematical correctness of the transaction - whether the loan notes (and resulting interest payments) are correctly distrubted according to the semantics of the loan's protocol is not relevant to ensure that there is no double spending.

# Glossary  

| term | description |
| --- | --- |
| balancing relationship | a instance of AZTEC note creation / destruction, where the sum of the values of the created notes is equal to the sum of the values of the destroyed notes |  
| mixed asset | a zero-knowledge AZTEC asset that both has a private representation (via AZTEC notes) and a public representation (via ERC20-like tokens) |  
| private asset | a zero-knowledge AZTEC asset where ownership is defined entirely through AZTEC notes and there is no linked ERC20 token. Such assets must directly create AZTEC notes via `confidentialMint` instructions |

