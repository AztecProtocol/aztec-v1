## Examples
### 1) Construct a proof that a note's value is less than or equal to another note

```js
// Enable the SDK
const apiKey = '7FJF5YK-WV1M90Y-G25V2MW-FG2ZMDV';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const address = '0x7Fd548E8df0ba86216BfD390EAEB5026adCb5B8a';
const asset = await window.aztec.zkAsset(address);

// Fetch your notes
const allNotes = await asset.fetchNotesFromBalance();

// Get the particular notes to compare - [change the example indices to change notes to compare]
const noteHash = allNotes[0].noteHash;
const comparisonNoteHash = allNotes[1].noteHash;

const note = await window.aztec.zkNote(noteHash)
const comparisonNote = await window.aztec.zkNote(comparisonNoteHash)

// Generate the lessThan proof - will create a proof if note <= comparisonNote, and fail if not
const lessThanOrEqualToProof = await note.lessThan(comparisonNote);
console.info({ lessThanOrEqualToProof });
```
