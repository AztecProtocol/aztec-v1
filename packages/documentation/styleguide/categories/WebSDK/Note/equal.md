## Examples
### 1) Generate a proof that a note's value is equal to 10
```js
// Enable the SDK
const apiKey = '071MZEA-WFWMGX4-JJ2C5C1-AVY458F';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);

const notes = await asset.fetchNotesFromBalance();
console.info({ notes });

```
