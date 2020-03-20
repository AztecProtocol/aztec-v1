![user-to-validator](https://github.com/AztecProtocol/specification/blob/master/userToValidator.png?raw=true)

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
4. ACE: (revert on failure)

## Zero-knowledge dApp contract interaction, an example flow with bilateral swaps

The following image depicts the flow of a zero-knowledge dApp that utilizes the `Swap` proof to issue transfer instructions to two zkAsset confidential digital assets. This example aims to illustrate the kind of confidential cross-asset interactions that are possible with AZTEC. Later iterations of the protocol will include proofs that enable similar multilateral flows.

The dApp-to-zkAsset interactions are identical for both `zkAsset A` and `zkAsset B`. To simplify the description we only describe the interactions for one of these two assets.

![zk-dapp-flow](https://github.com/AztecProtocol/specification/blob/master/zkDappFlow2.png?raw=true)

### (1-5) : Validating the proof

1. `zk dApp` receives a `Swap` zero-knowledge proof from `caller` (with a defined `uint24 _proof` and `bytes data`.

2. The `zk-dApp` contract queries `ACE` to validate the received proof, via `ACE.validateProof(_proof, msg.sender, data)`. If `_proof` is not supported by `zk-dApp` the transaction will `revert`.

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

-   For every input `note`, is `approved[note.noteHash][msg.sender] == true`?

If this is not the case, the transaction will `revert`.

9. If all input notes have been `approved`, `zkAsset A` will instruct `ACE` to update its note registry according to the instructions in `proofOutput`, via `ACE.updateNoteRegistry(_proof, proofOutput, msg.sender)`.

10. On receipt of `bytes proofOutput`, `ACE` will also validate that the `proofOutput` instruction came from a valid zero-knowledge proof (and `revert` if this is not the case). Having been satisfied of the proof's correctness, `ACE` will instruct the note registry owned by `msg.sender` (`zkAsset A`) to process the transfer instruction.

11. `NoteRegistry A` will validate the following is correct:

-   For every input `note`, is `note.noteHash` present inside the `registry`?
-   For every output `note`, is `note.noteHash` _not_ present inside the `registry`?

If `proofOutput.publicValue > 0`, the registry will call `erc20.transfer(proofOutput.publicOwner, uint256(proofOutput.publicValue))`.

If `proofOutput.publicValue < 0`, the registry will call `erc20.transferFrom(proofOutput.publicOwner, this, uint256(-proofOutput.publicValue))`.

12. If the resulting transfer instruction fails, the transaction is `reverted`, otherwise control is returned to `Note Registry A`

13-15. If the transaction is successful, control is returned to `ACE`, followed by `zkAsset A` and `zk-dApp`.

16. Following the successful completion of the confidential transfer (from both `zkAsset A` and `zkAsset B`), control is returned to `caller`. It is assumed that `zk-dApp` will emit relevant transfer events, according to the ERC-1724 confidential token standard.

## The rationale behind multilateral confidential transactions

The above instruction demonstrates a practical confidential cross-asset settlement mechanism. Without `ACE`, a confidential digital asset could only process a transfer instruction after validating the instruction conforms to its own internal confidential transaction semantics, a process that would require validating a zero-knowledge proof.

This would result in 3 distinct zero-knowledge proofs being validated (one each by `zk-dApp`, `zkAsset A`, `zkAsset B`). Because zero-knowledge proof validation is the overwhelming contributor to the cost of confidential transactions, this creates a severe obstacle to practical cross-asset confidential interactions.

However, by subscribing to `ACE` as the arbiter of valid proofs, these three smart contracts can work in concert to process a multilateral confidential transfer having validated only a single zero-knowledge proof (this is because the `Swap` proof produces transfer instructions that lead to two balancing relationships. Whilst `zkAsset A` and `zkAsset B` do not know this (the proof in question could have been added to `ACE` _after_ the creation of these contracts), `ACE` does, and can act as the ultimate arbiter of whether a transfer instruction is valid or not.

Whilst it may apear that this situation requires AZTEC-compatible assets to 'trust' that ACE will correctly validate proofs, it should be emphasized that `ACE` is a completely deterministic smart-contract whose code is fully available to be examined. No real-world trust (e.g. oracles or staking mechanisms) is required. The source of the guarantees around the correctness of AZTEC's confidential transactions come from its zero-knowledge proofs, all of which have the properties of completeness, soundness and honest-verifier zero-knowledge.
