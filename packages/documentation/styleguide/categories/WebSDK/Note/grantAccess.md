## Examples

### Grant note view access to a third party.

```js
const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);

const [note] = await asset.fetchNotesFromBalance({ numberOfNotes: 1 });
const myNote = await window.aztec.zkNote(note.noteHash);

const thirdPartyAddress = '';
const addressToGrantAccess = [
    thirdPartyAddress,
    // Add more addresses to grant access
];

const grantSuccess = await myNote.grantAccess(addressToGrantAccess);
console.info({ grantSuccess });
```
