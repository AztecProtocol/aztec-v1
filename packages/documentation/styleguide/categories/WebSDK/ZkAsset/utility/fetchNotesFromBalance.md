## Examples

### Fetch notes corresponding to a particular query.

```js
const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);

const query = {
    numberOfNotes: 1,
    equalTo: 20,
    greaterThan: 10,
    lessThan: 30,
};

// Fetch notes
const notes = await asset.fetchNotesFromBalance(query);
console.info({ notes });
```

### Fetch all notes.

```js
const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);

// Fetch notes
const notes = await asset.fetchNotesFromBalance();
console.info({ notes });
```
