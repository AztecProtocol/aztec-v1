The ACE.sol contract is responsible for validating the set of AZTEC zero-knowledge proofs and performing any transfer instructions involving AZTEC notes. ACE is the controller of all AZTEC note registries and acts as the custodian of both AZTEC notes and any tokens that have been converted into AZTEC notes.

While it is possible to define note registries that are external to ACE, the state of these contract's note registries cannot be guranteed and only a subset of proofs will be usable (i.e. if an asset uses an ACE note registry, transfer instructions from AZTEC proofs that involve multiple note registries are only enacted if every note registry is controlled by ACE).

The ACE has the following interface:

```static solidity
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

-   Extendibility. AZTEC's modular proof system enables composable confidential transaction semantics - adding more proofs enables these semantics to be more expressive. Additionally, it allows the AZTEC protocol to support fundamentally new types of zero-knowledge proving technology as Ethereum scales (e.g. bulletproofs, zk-snarks)
-   Opt-out functionality. If an asset controller only wants to listen to a subset of proofs (e.g. whether to listen to newly added proofs is on their terms. This is important for assets that have an internal review process for zero-knowledge proofs)
-   Qualified immutability. The validator code for a given proof id should never change. AZTEC must be able to de-activate a proof if it is later found to contain a bug, but any upgrades or improvement to a proof are expressed by instantiating a new validator contract, with a new proof id.

A proof is uniquely defined by an identifier`uint24 _proof`. ACE stores a mapping that maps each `_proof` to the address of a smart contract that validates the zero-knowledge proof in question.

Instead of having a 'universal' validation smart contract, it was chosen to make these contracts discrete for maximum flexibility. Validator contracts should not be upgradable, to gurantee that users of AZTEC proofs can have confidence that the proofs they are using are not subject to change. Upgrades and changes are implemented by adding new validator contracts and new proofs.

The `uint24 _proof` variable contains the concatenation of three `uint8` variables (the rationale for this compression is to both reduce `calldata` size and to simplify the interface. Our javascript APIs automatically compose proofs with the correct `_proof`, minimizing the amount of variables that a builder on AZTEC has to keep track of.

The formatting as follows (from most significant byte to least significant byte)

| name     | type  | description                                                  |
| -------- | ----- | ------------------------------------------------------------ |
| epoch    | uint8 | the broad family that this proof belongs to                  |
| category | uint8 | the general function of this proof                           |
| id       | uint8 | the proof's identifier, for the specified category and epoch |

A semantic-style version system was not used because proof `epoch` defines functionality as well as a form of version control. Proofs with the same `uint8 id` but with different `uint8 epoch` do not neccesarily perform the same function and proofs from a later `epoch` are not strictly 'better' than proofs from an earlier `epoch`.

For example, if the basic family of AZTEC proofs was adapted for confidential transactions that do not use a trusted setup, these proofs would be categorized by a new `epoch`. However these would not be a strict upgrade over the earlier epoch because the gas costs to verify these proofs would be almost an order of magnitude greater.

Similarly, when confidential voting mechanics are implemented into `ACE`, these will be defined by a separate `epoch` to emphasise their different functionality vs confidential transactions.

The `uint8 category` variable represents an enum with the four following values:

| value | name     | description                                                                |
| ----- | -------- | -------------------------------------------------------------------------- |
| 0x01  | BALANCED | proofs that satisfy a balancing relationship                               |
| 0x02  | MINT     | proofs that can be used to mint AZTEC notes                                |
| 0x03  | BURN     | proofs that can be used to burn AZTEC notes                                |
| 0x04  | UTILITY  | utility proofs that can not, in isolation, be used to issue note transfers |

The `ACE` contract has separate logic to handle `BALANCED`, `MINT` and `BURN` proofs, as the latter two expressly violate the balancing relationship used to prevent double spending. The `MINT` and `BURN` proofs are designed for fully private AZTEC assets, ones with no ERC20 token equivalent, where AZTEC notes are the primary expression of value. Additional restrictions are placed on their use because of this.

For more information regarding minting and burning, see the [mint](#minting-aztec-notes) and [burn](#burning-aztec-notes) section.

The `UTILITY` proofs are designed for assets that require additional validation logic before a transaction can be performed. For example, an asset might require a trader to prove that they own less than 10% of the total supply of the asset before a trade is processed. This is supported by our `dividend` utility proof.

This specification contains [descriptions](#aztec-verifiers-joinsplitsol) for every currently supported proof id. Formal descriptions of the zero-knowledge proofs utilized by the verifiers can be found in the [AZTEC protocol paper](http://www.github.com/AZTECProtocol/AZTEC).

When combined together, `uint8 epoch, uint8 category, uint8 id` create 65025 unique proof identifies for each category. Given the complexity of zero-knowledge cryptographic protocols and the validation that must be performed before integration into `ACE`, it is infeasible for there to ever be demand for more than `65025` types of zero-knowledge proof inside `ACE`.

## Enacting confidential transfer instructions - defining the ABI encoding of proofOutputs

There is substantial variation between the zero-knowledge proofs that AZTEC utilizes. Because of this, and the desire to create a simple interface to validate proofs, the interface for proof _inputs_ is generic. An AZTEC proof accepts three parameters: `bytes data, address sender, uint256[6] commonReferenceString`. The `commonReferenceString` is provided by ACE. The `data` variable contains the zero-knowledge proof data in question, the `address sender` field is utilized to [eliminate front-running](#a-preventing-collisions-and-front-running). The ABI-encoding of `bytes data` is specific to a given validator smart contract.

The **output** of a zero-knowledge proof is a list of instructions to be performed. It is important that these `proofOutput` variables conform to a common standard so that existing confidential assets can benefit from the addition of future proofs.

An instruction must contain the following:

-   A list of the notes to be destroyed, the 'input notes'
-   A list of the notes to be created, the 'output notes'
-   If public tokens are being transferred, how many tokens are involved, who is the beneficiary and what is the direction of the transfer? (into ACE or out of ACE?)

In addition to this, ACE must support one zero-knowledge proof producing _multiple_ instructions (e.g. the `Swap` proof provides transfer instructions for two distinct assets).

Proofs in the `UTILITY` category also conform to this specification, although in this context 'input' and 'output' notes are not created or destroyed.

To summarise, the output of any AZTEC validator smart contract is a `bytes proofOutputs` variable, that encodes a dynamic array of `bytes proofOutput` objects. The ABI encoding is as follows:

## ABI encoding for `bytes proofOutputs`

| Offset                                            | Length           | Name           | Type            | Description                                                                                            |
| ------------------------------------------------- | ---------------- | -------------- | --------------- | ------------------------------------------------------------------------------------------------------ |
| 0x00                                              | 0x20             | length         | uint256         | the number of `proofOutput` objects                                                                    |
| 0x20                                              | (0x20 \* length) | offsets        | uint256[length] | array of 0x20-sized variables that contain the relative offset to each respective `proofOutput` object |
| 0x20 + (0x20 \* length) + (\sum\_{j=0}^{i-1}L[j]) | L[i]             | proofOutput[i] | bytes           | the `bytes proofOutput` object                                                                         |

## ABI encoding for `bytes proofOutput = proofOutputs[i]`

| Offset     | Length | Name          | Type    | Description                                                                         |
| ---------- | ------ | ------------- | ------- | ----------------------------------------------------------------------------------- |
| 0x00       | 0x20   | inputsOffset  | uint256 | the relative offset to `bytes inputNotes`                                           |
| 0x20       | 0x20   | outputsOffset | uint256 | the relative offset to `bytes outputNotes`                                          |
| 0x40       | 0x20   | publicOwner   | address | the Ethereum address of the owner of tokens being transferred                       |
| 0x60       | 0x20   | publicValue   | int256  | the amount of public 'value' being transferred                                      |
| 0x80       | 0x20   | challenge     | uint256 | the 'challenge' variable used in the zero-knowledge proof that produced this output |
| 0xa0       | L_1    | inputNotes    | bytes   | the `bytes inputNotes` variable                                                     |
| 0xa0 + L_1 | L_2    | outputNotes   | bytes   | the `bytes outputNotes` variable                                                    |

Both `bytes inputNotes` and `bytes outputNotes` are dynamic arrays of AZTEC notes, encoded according to the AZTEC note ABI spec.

The `int256 publicValue` variable is a _signed_ integer, because negative values are interpreted as tokens being transferred _from_ `address publicOwner` and into `ACE`. Similarly, positive values are interpreted as tokens being transferred _to_ `address publicOwner`.

It should be noted that `int256 publicValue` does not represent an absolute number of tokens. Each registry inside `NoteRegistry` has an associated `uint256 scalingFactor`, that defines how many ERC20 tokens are represented by 1 unit of AZTEC note 'value'. This mapping is neccessary because AZTEC note values are approximately 30-bit integers (CAVEAT HERE) and a scaling factor is required to map 256-bit ERC20 token volumes to 30-bit AZTEC values.

The `uint256 challenge` variable is used to ensure that each `bytes proofOutput` produces a unique hash. The challenge variable is required for every AZTEC zero-knowledge proof, and is itself a unique pseudorandom identifier for the proof (two satisfying zero-knowledge proofs cannot produce matching challenge variables without a hash collision). For a proof that produces multiple `bytes proofOutput` entries inside `bytes proofOutputs`, it is the responsibility of the verifier smart contract to ensure each challenge variable is unique (i.e. each `bytes proofOutput` contains a challenge variable that is a hash of the challenge variable for the previous entry).

Consequently, a hash of `bytes proofOutput` creates a unique identifier for a proof instruction because of the uniqueness of the challenge variable.

## Cataloguing valid proofs inside ACE

Once a `BALANCED`, `MINT` or `BURN` proof has been validated, ACE records this fact so that future transactions can query the proof in question. This is done by creating a keccak256 hash of the following variables (encoded in an unpacked form)

| Offset | Length | Name       | Type    | Description                             |
| ------ | ------ | ---------- | ------- | --------------------------------------- |
| 0x00   | 0x20   | proofHash  | bytes32 | a keccak256 hash of `bytes proofOutput` |
| 0x20   | 0x20   | \_proof    | uint24  | the \_proof of the proof                |
| 0x40   | 0x20   | msg.sender | address | the address of the entity calling `ACE` |

This creates a unique key, that is mapped to `true` if the proof is valid (invalid proofs are not stored).

Contracts can query `ACE` with a `bytes proofOutput`, combined with a `uint24 _proof` and the `address` of the entity that issued the instruction. `ACE` can validate whether this instruction came from a valid proof.

This mechanism enables smart contracts to issue transfer instructions on behalf of both users and other smart contracts, enabling zero-knowledge confidential dApps.

## ACE owner

It should be noted that upon deployment, the owner of the ACE will be a multi-signature wallet. The multi-sig wallet used is defined here: https://github.com/AztecProtocol/AZTEC/blob/develop/packages/protocol/contracts/MultiSig/MultiSigWalletWithTimeLock.sol
