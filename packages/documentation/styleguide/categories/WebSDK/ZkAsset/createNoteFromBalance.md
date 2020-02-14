## Examples
### Create a note worth 10 from the use's balance
```js
// Enable the SDK
const apiKey = '071MZEA-WFWMGX4-JJ2C5C1-AVY458F';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);

const note = await asset.createNoteFromBalance(10);
console.info({ note });
```
