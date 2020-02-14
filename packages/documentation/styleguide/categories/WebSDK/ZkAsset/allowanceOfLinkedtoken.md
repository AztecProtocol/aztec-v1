## Examples
### Get a spender's allowance of linked tokens, on behalf of the owner

```js
// Enable the SDK
const apiKey = '071MZEA-WFWMGX4-JJ2C5C1-AVY458F';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);

// Get the linkedToken balance
const tokenAllowance = await asset.allowanceOfLinkedToken();
console.info({ tokenAllowance });
```
