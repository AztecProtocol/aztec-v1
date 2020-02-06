## Examples
### 1) Construct a proof that a note's value is less than a comparison note

```js
// Enable the SDK
const apiKey = '071MZEA-WFWMGX4-JJ2C5C1-AVY458F';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const address = '0x70c23EEC80A6387464Af55bD7Ee6C8dA273C4fb4';
const asset = await window.aztec.zkAsset(address);

// Fetch your notes
const allNotes = await asset.fetchNotesFromBalance();

// Get the particular notes to compare - [change the example indices to change notes to compare]
const noteHash = allNotes[0].noteHash;
const comparisonNoteHash = allNotes[1].noteHash;

const note = await window.aztec.zkNote(noteHash)
const comparisonNote = await window.aztec.zkNote(comparisonNoteHash)

// Generate the lessThan proof - will create a proof if note < comparisonNote, and fail if not
const lessThanProof = await note.lessThan(comparisonNote);
console.info({ lessThanProof });
```
