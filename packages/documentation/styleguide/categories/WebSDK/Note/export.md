## Examples
### 1) Export a note and return the aztec.js note class instance, so it can be used in proofs
```js
// Enable the SDK
const apiKey = '7FJF5YK-WV1M90Y-G25V2MW-FG2ZMDV';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const address = '0x7Fd548E8df0ba86216BfD390EAEB5026adCb5B8a';
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
