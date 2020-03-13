## Examples

### Get the total supply of the linkedToken

```js
const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);

// Get the linked token's total suppply
const totalSupply = await asset.totalSupplyOfLinkedToken();
console.info({ totalSupply });
console.info('Total supply:', totalSupply.toString());
```
