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
