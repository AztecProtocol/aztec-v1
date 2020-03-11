## Examples

### Construct a proof that a note's value is greater than or equal to a comparison note.

```js
const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);

const [note1, note2] = await asset.fetchNotesFromBalance({ numberOfNotes: 2 });
const myNote1 = await window.aztec.zkNote(note1.noteHash);
const myNote2 = await window.aztec.zkNote(note2.noteHash);

const [largerNote, smallerNote] = myNote1.value >= myNote2.value
  ? [myNote1, myNote2]
  : [myNote2, myNote1];

const proof = await largerNote.greaterThanOrEqualTo(smallerNote);
console.info({ proof });
```
