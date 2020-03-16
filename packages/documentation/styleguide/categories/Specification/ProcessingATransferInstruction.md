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
