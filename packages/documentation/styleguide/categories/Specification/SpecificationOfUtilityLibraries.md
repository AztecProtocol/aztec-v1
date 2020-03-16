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
