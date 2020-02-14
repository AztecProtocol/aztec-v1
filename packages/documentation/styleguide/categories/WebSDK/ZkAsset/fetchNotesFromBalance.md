## Examples
### Fetch notes corresponding to a particular query
```js
// Enable the SDK
const apiKey = '071MZEA-WFWMGX4-JJ2C5C1-AVY458F';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
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


### Fetch all notes
```js
// Enable the SDK
const apiKey = '071MZEA-WFWMGX4-JJ2C5C1-AVY458F';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);

// Fetch notes
const notes = await asset.fetchNotesFromBalance();
console.info({ notes });
```

