## Examples

### Get a spender's allowance of linked tokens, on behalf of the owner.

```js
const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);

// Get the linkedToken balance
const tokenAllowance = await asset.allowanceOfLinkedToken();
console.info({ tokenAllowance });
console.info('Allowance:', tokenAllowance.toString());
```
