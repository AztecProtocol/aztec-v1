## Examples

### Construct a proof that a note's value is less than or equal to another note.

```js
const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);

const [note1, note2] = await asset.fetchNotesFromBalance({ numberOfNotes: 2 });
const myNote1 = await window.aztec.zkNote(note1.noteHash);
const myNote2 = await window.aztec.zkNote(note2.noteHash);

const [smallerNote, largerNote] = myNote1.value <= myNote2.value ? [myNote1, myNote2] : [myNote2, myNote1];

const proof = await smallerNote.lessThanOrEqualTo(largerNote);
console.info({ proof });
```
