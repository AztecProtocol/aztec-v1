## Examples

### Get a user's balance, held by a ZkAsset.

```js
const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);

const assetBalance = await asset.balance();
console.info({ assetBalance });
```
