## Examples

### Construct a proof that a note's value is greater than a comparison note.

```js
const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);

const [note] = await asset.fetchNotesFromBalance({
  numberOfNotes: 1,
  greaterThan: 0,
});
const myNote = await window.aztec.zkNote(note.noteHash);
const value = myNote.value;

// Create a raw AZTEC note for another user that has less value
const thirdPartyAddress = '';
const user = await window.aztec.user(thirdPartyAddress);
const anotherNote = await user.createNote(value - 1);

const proof = await myNote.greaterThan(anotherNote);
console.info({ proof });
```
