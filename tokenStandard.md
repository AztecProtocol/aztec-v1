---
eip: <to be assigned>
title: A confidential token standard
author: AZTEC
discussions-to: <URL>
status: Draft
type: <Standards Track>
category (*only required for Standard Track): <ERC>
created: 2019-01-03
---

<!--You can leave these HTML comments in your merged EIP and delete the visible duplicate text guides, they will not appear and may be helpful to refer to if you edit it again. This is the suggested template for new EIPs. Note that an EIP number will be assigned by an editor. When opening a pull request to submit your EIP, please use an abbreviated title in the filename, `eip-draft_title_abbrev.md`. The title should be 44 characters or less.-->
This is the suggested template for new EIPs.

Note that an EIP number will be assigned by an editor. When opening a pull request to submit your EIP, please use an abbreviated title in the filename, `eip-draft_title_abbrev.md`.

The title should be 44 characters or less.

## Simple Summary
<!--"If you can't explain it simply, you don't understand it well enough." Provide a simplified and layman-accessible explanation of the EIP.-->
This EIP defines the standard interface and behaviours of a confidential token contract, where ownership values and the values of transfers are encrypted.

## Abstract
<!--A short (~200 word) description of the technical issue being addressed.-->
This standard defines a way of interacting with a *confidential* token contract. Confidential tokens do not have traditional balances - value is represented by *notes*, which are composed of a public owner and an encrypted value. Value is transferred by splitting a note into multiple notes with different owners. Similarly notes can be combined into a larger note. Note splitting is analogous to Bitcoin UTXOs, they are a good mental model to follow.
  
These 'join-split' transactions must satisfy a balancing relationship (the sum of the values of the old notes must be equal to the sum of the values of the new notes) - this can be proven via a zero-knowledge proof described by the AZTEC protocol.

## Motivation
<!--The motivation is critical for EIPs that want to change the Ethereum protocol. It should clearly explain why the existing protocol specification is inadequate to address the problem that the EIP solves. EIP submissions without sufficient motivation may be rejected outright.-->
The ability to transact in confidentiality is a requirement for many kinds of financial instruments. The motivation of this EIP is to establish a standard that defines how these confidential assets are constructed and traded. Similar to an ERC20 token, if confidential tokens conform to the same interface then this standard can be re-used by other on-chain applications, such as confidential decentralized exchanges or confidential escrow accounts.  
  
The ERCZ20 token interface is designed such that the economic beneficiary of any transaction is completely divorced from the transaction sender. This is to facilitate the use of one-time stealth addresses to 'own' AZTEC notes. Such addresses will not easily be fundable with gas to pay for transactions (without leaking information). Creating a clear separation between the transaction sender and the economic beneficiary allows third party service layers to be tasked with the responsibility to sign transactions.

## Specification
<!--The technical specification should describe the syntax and semantics of any new feature. The specification should be detailed enough to allow competing, interoperable implementations for any of the current Ethereum platforms (go-ethereum, parity, cpp-ethereum, ethereumj, ethereumjs, and [others](https://github.com/ethereum/wiki/wiki/Clients)).-->
An example ERCZ20 token contract

```
interface ERCZ20 {
    function aztecCryptographyEngine() public view returns (address);
    function confidentialIsApproved(address spender, bytes32 noteHash) public view returns (bool);
    function confidentialTotalSupply() public view returns (uint256);
    function publicToken() public view returns (address);
    function supportsProof(uint16 _proofId) public view returns (bool);
    function scalingFactor() public view returns (uint256);

    function confidentialApprove(bytes32 _noteHash, address _spender, bool _status, bytes _signature) public;
    function confidentialTransfer(bytes _aztecProof) public;
    function confidentialTransferFrom(uint16 _aztecProofId, bytes _aztecProof) public;

    event LogCreateConfidentialNote(address indexed _owner, bytes _metadata);
    event LogDestroyConfidentialNote(address indexed _owner, bytes32 _noteHash);
}
```  

The token contract must implement the above interface to be compatible with the standard. The implementation must follow the specifications described below.

### The AZTEC `noteRegistry`

A token that conforms to the ERCZ20 standard must have a method of storing the token's set of *unspent* AZTEC notes. The AZTEC cryptography engine identifies notes with the following tuple:

1. A `bytes32 noteHash` variable, a `keccak256` hash of a note's encrypted data
2. A `address owner` variable, an `address` that defines a note's owner
3. A `bytes metadata` variable, the metadata is a combination of `secp256k1` and `bn128` group elements that allows a note owner to recover and decrypt the note.
   
An example implementation of ERCZ20 represents this as a mapping from `noteHash` to `owner`: `mapping(bytes32 => address) noteRegistry;`. The `metadata` is required for logging purposes only, the `noteHash` and `owner` variables alone are enough to define a unique note.

### View functions

### ```aztecCryptographyEngine```

```
function aztecCryptographyEngine() view returns (address)
```

This function returns the address of the smart contract that validates this token's zero-knowledge proofs. For the specification of the AZTEC cryptography engine please see (TODO).

> <small>**returns:** address of the AZTEC cryptography engine that validates this token's zero-knowledge proofs</small>

### ```publicToken```

```
function publicToken() view returns (address)
```

This function returns the address of the public token that this confidential token is attached to. The public token should conform to the ERC20 token standard. This link enables a user to convert between an ERC20 token balance and confidential ERCZ20 notes.  
  
If the token has no public analogue (i.e. it is a purely confidential token) this method should return `0`.

> <small>**returns:** address of attached ERC20 token</small>

### ```supportsProof```

```
function supportsProof(uint16 _proofId) view returns (bool);
```

This function returns whether this token supports a specific AZTEC zero-knowledge proof ID. The AZTEC cryptography engine supports a number of zero-knowledge proofs. The token creator may wish to only support a subset of these proofs.  

The rationale behind using a `uint16` variable is twofold:

1. The total number of proofs supported by the engine will never grow to be larger than 65535
2. The purpose of the engine is to define a 'grammar' of composable zero-knowledge proofs that can be used to define the semantics of confidential transactions and the total set will be quite small. Using an integer as a proofID allows for a simple bit-filter to validate whether a proof is supported or not (TODO put somewhere else).

> <small>**returns:** boolean that defines whether a proof is supported by the token</small>

### ```confidentialTotalSupply```

```
function confidentialTotalSupply() view returns (uint256);
```

This function returns the total sum of tokens that are currently represented in zero-knowledge note form by the contract. This value must be equal to the sum of the values of all unspent notes, which is validated by the AZTEC cryptography engine. Note that this function may leak privacy if there's only one user of the ERCZ20 contract instance.

> <small>**returns:** the combined value of all confidential tokens</small>

### ```scalingFactor```

```
function scalingFactor() view returns (uint256);
```

This function returns the token `scalingFactor`. The range of integers that can be represented in an AZTEC note is smaller than the native word size of the EVM (~30 bits vs 256 bits). As a result, a scaling factor is applied when converting between public tokens and confidential note form. An ERC20 token value of `1` corresponds to an ERCZ20 value of `scalingFactor`.

> <small>**returns:** the multiplier used when converting between confidential note values and public tokens</small>

### Approving addresses to transact AZTEC notes  

For confidential transactions to become truly useful, it must be possible for smart contracts to transact notes on behalf of their owners. For example a confidential decentralized exchange or a confidential investment fund. These transactions still require zero-knowledge proofs that must be constructed on-chain, but they can be constructed on behalf of note owners and validated against ECDSA signatures signed by note owners.  

To this end, a `confidentialApprove` method is required to delegate 

### ```confidentialApprove```

```
function confidentialApprove(bytes32 _noteHash, address _spender, bool _status, bytes _signature);
```  

This function allows a note owner to approve the address `approved` to 'spend' an AZTEC note in a ```confidentialTransferFrom``` transaction.

> <small>**parameters**</small>  
> <small>`_noteHash`: the hash of the AZTEC note being approved</small>  
> <small>`_sender`: the address of the entity being approved</small>  
> <small>`_status`: defines whether `approved` is being given permission to spend a note, or if permission is being revoked</small>  
> <small>`_signature`: ECDSA signature from the note owner that validates the `confidentialApprove` instruction</small>  

## Confidential Transfers

The action of sending confidential notes requires an AZTEC zero-knowledge proof to be validated. The semantics of this proof will vary depending on the *proof ID*. For example, the zero-knowledge proof required to partially fill an order between two AZTEC assets and the zero-knowledge proof required for a unilateral 'join-split' transaction are different proofs, with different validation logic. Every proof supported by the AZTEC cryptography engine shares the following common feature:  

* A *balancing relationship* has been satisfied - the sum of the values of the notes "to be created" equals the sum of the values of the notes "to be spent"

To validate a zero-knowledge proof, the token smart contract must call the AZTEC cryptography engine's `validateProof(uint16 proofId, bytes proofData) public returns (bytes32[] destroyedNotes, Note[] createdNotes, address publicOwner, int256 publicValue)` function. This method will throw an error if the proof is invalid. If the proof is *valid*, the following data is returned:

> <small>**createdNotes:** the array of notes the proof wishes to create</small>
> <small>**destroyedNotes:** the array of notes the proof wishes to destroy</small>
> <small>**publicOwner:** if a public conversion is required, this is the address of the public token holder</small>
> <small>**publicValue:** if a public conversion is required, this is the amount of tokens to be transferred to the public token holder. Can be negative, which represents a conversion from the public token holder to the ERCZ20 contract</small>  

The structure of `Note` is the following:

```
struct Note {
    address owner;
    bytes32 noteHash;
    bytes metadata;
}
```  

The above information can be used by the ERCZ20 token to validate the *legitimacy* of a confidential transfer.

### Transacting confidential notes directly  

Basic 'unilateral' transfers of AZTEC notes are enabled via the AZTEC 'join-split' transaction, accessed via the `confidentialTransfer` method.

### ```confidentialTransfer``` function

```
function confidentialTransfer(bytes proofData) public;
```  

This function is designed as an analogue to the ERC20 `transfer` method.  

To enact a `confidentialTransfer` method call, the token contract must check and perform the following:

1. Successfully execute `cryptographyEngine.validateProof(1, proofData)`
   * If this proof is valid, then for every note being consumed in the transaction, the note owner has provided a satisfying ECDSA signature
2. Examine the output of `cryptographyEngine.validateProof` `(createdNotes, destroyedNotes, publicOwner, publicValue)` and validate the following:
   1. Every `Note` in `destroyedNotes` exists in the token's note registry
   2. Every `Note` in `createdNotes` does *not* exist in the token's note registry

If the above conditions are satisfied, the following steps must be performed:

1. If `publicValue < 0`, call `erc20Token.transferFrom(publicOwner, this, uint256(-publicValue))`. If this call fails, abort the transaction
2. If `publicValue > 0`, call `erc20Token.transfer(publicOwner, uint256(publicValue))`
3. Update the token's total confidential supply to reflect the above transfers
4. For every `Note` in `destroyedNotes`, remove `Note` from the token's note registry and emit `LogDestroyConfidentialNote(Note.owner, Note.noteHash)`
5. For every `Note` in `createdNotes`, add `Note` to the token's note registry and emit `LogCreateConfidentialNote(Note.owner, Note.metadata)`
6. Emit the `ConfidentialTransfer` event.

### Transacting confidential notes on behalf of a note owner

For more exotic forms of transfers, mediated by smart contracts, the `confidentialTransferFrom` method is used.  

### ```confidentialTransferFrom```

```
confidentialTransferFrom(uint16 _proofId, bytes _proofData);
```

This function enacts a confidential transfer of AZTEC notes. This function is designed as an analogue to the ERC20 `transferFrom` method, to be called by smart contracts that enact confidential transfers.  

To enact a `confidentialTransferFrom` method call, the token contract must check and perform the following:

1. The `proofId` must correspond to a proof supported by the token
2. Successfully execute `cryptographyEngine.validateProof(proofId, proofData)`
3. Examine the output of `cryptographyEngine.validateProof` `(createdNotes, destroyedNotes, publicOwner, publicValue)` and validate the following:
   1. Every `Note` in `destroyedNotes` exists in the token's note registry
   2. Every `Note` in `createdNotes` does *not* exist in the token's note registry
   3. For every `Note` in `destroyedNotes`, `confidentialIsApproved(noteHash, msg.sender)` returns `true`

If the above conditions are satisfied, the following steps must be performed:

1. If `publicValue < 0`, call `erc20Token.transferFrom(publicOwner, this, uint256(-publicValue))`. If this call fails, abort the transaction
2. If `publicValue > 0`, call `erc20Token.transfer(publicOwner, uint256(publicValue))`
3. Update the token's total confidential supply to reflect the above transfers
4. For every `Note` in `destroyedNotes`, remove `Note` from the token's note registry and emit `LogDestroyConfidentialNote(Note.owner, Note.noteHash)`
5. For every `Note` in `createdNotes`, add `Note` to the token's note registry and emit `LogCreateConfidentialNote(Note.owner, Note.metadata)`
6. Emit the `LogConfidentialTransfer` event.

### Events

### ```LogCreateConfidentialNote```

```
event LogCreateConfidentialNote(address indexed _owner, bytes_metadata)
```  

An event that logs the creation of a note against the note owner and the note metadata.  

> <small>**parameters**</small>  
> <small>`_owner`: The Ethereum address of the note owner</small>  
> <small>`_metadata`: Data required by the note owner to recover and decrypt their note</small>

### ```LogDestroyConfidentialNote```

```
event LogDestroyConfidentialNote(address indexed owner)
```  

An event that logs the destruction of a note against the note owner and the note metadata.  

> <small>**parameters**</small>  
> <small>`_owner`: The ethereum address of the note owner</small>  
> <small>`_noteHash`: The hash of the note. Note `metadata` can be recovered from the `LogDestroyConfidentialNote` event that created this note</small>

## Implementation
<!--The implementations must be completed before any EIP is given status "Final", but it need not be completed before the EIP is accepted. While there is merit to the approach of reaching consensus on the specification and rationale before writing code, the principle of "rough consensus and running code" is still useful when it comes to resolving many discussions of API details.-->
TODO. Requires several modifications to existing proof-of-concept AZTEC token  