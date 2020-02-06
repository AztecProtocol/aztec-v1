## Examples
### 1) Export a note and return the aztec.js note class instance, so it can be used in proofs
```js
// Enable the SDK
const apiKey = '071MZEA-WFWMGX4-JJ2C5C1-AVY458F';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const address = '0x70c23EEC80A6387464Af55bD7Ee6C8dA273C4fb4';
const asset = await window.aztec.zkAsset(address);

// Fetch your notes
const allNotes = await asset.fetchNotesFromBalance();

// Get the particular note
const particularNoteHash = allNotes[0].noteHash;
const note = await window.aztec.zkNote(particularNoteHash)

// Export the note
const exportedNote = await note.export();
console.info({ exportedNote });
```
