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
