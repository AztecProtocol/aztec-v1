## Examples
### Get a user's balance, held by a ZkAsset
```js
const userAddress = '';

// Enable the SDK
const apiKey = '071MZEA-WFWMGX4-JJ2C5C1-AVY458F';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);

const assetBalance = await asset.balance();
console.info({ assetBalance });
```
