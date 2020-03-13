## Examples

### Get the balance of the linked token.

```js
const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);

// Get the linkedToken balance
const linkedTokenBalance = await asset.balanceOfLinkedToken();
console.info({ linkedTokenBalance });
console.info('Balance:', linkedTokenBalance.toString());
```
