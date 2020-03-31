## Examples

### Fetch the users transaction history for a particular asset

```js
const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);

// Fetch txs
const txs = await asset.transactions();
console.info({ txs });
```
