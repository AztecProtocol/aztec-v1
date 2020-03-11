## Examples

### Export a note and return the aztec.js note class instance, so it can be used in proofs.

```js
const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);

const [note] = await asset.fetchNotesFromBalance({ numberOfNotes: 1 });
const zkNote = await window.aztec.zkNote(note.noteHash);

// Export the note
const exportedNote = await zkNote.export();
console.info({ exportedNote });
```
