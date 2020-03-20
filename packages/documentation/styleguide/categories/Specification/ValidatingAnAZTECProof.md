AZTEC zero-knowledge proofs can be validated via `ACE.validateProof(uint24 _proof, address sender, bytes calldata data) external returns (bytes memory proofOutputs)`.

The `bytes data` uses a custom ABI encoding that is unique to each proof that AZTEC supports. It is intended that, if a contract requires data from a proof, that data is extracted from `bytes proofOutputs` and not the input data.

If the `uint8 category` inside `_proof` is of type `BALANCED`, `ACE` will record the validity of the proof as a state variable inside `mapping(bytes32 => bool) validatedProofs`.

If the proof is not valid, an error will be thrown. If the proof is valid, a `bytes proofOutputs` variable will be returned, describing the instructions to be performed to enact the proof. For `BALANCED` proofs, each individual `bytes proofOutput` variable inside `bytes proofOutputs` will satisfy a balancing relationship.
