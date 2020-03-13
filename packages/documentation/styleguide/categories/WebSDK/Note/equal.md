## Examples

### Generate a proof that a note's value is equal to another note.

```js
const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);

const [note] = await asset.fetchNotesFromBalance({ numberOfNotes: 1 });
const myNote = await window.aztec.zkNote(note.noteHash);
const value = myNote.value;

// Create a raw AZTEC note for another user that has the same value
const thirdPartyAddress = '';
const user = await window.aztec.user(thirdPartyAddress);
const anotherNote = await user.createNote(value);

const proof = await myNote.equal(anotherNote);
console.info({ proof });
```

### Will throw an error if the two notes have different values.

```js
const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);

const [note] = await asset.fetchNotesFromBalance({ numberOfNotes: 1 });
const myNote = await window.aztec.zkNote(note.noteHash);
const value = myNote.value;

const thirdPartyAddress = '';
const user = await window.aztec.user(thirdPartyAddress);
const anotherNote = await user.createNote(value - 1);

const proof = await myNote.equal(anotherNote);
```
