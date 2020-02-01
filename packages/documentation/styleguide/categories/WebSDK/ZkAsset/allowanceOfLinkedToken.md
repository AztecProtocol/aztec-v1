## Examples
### Get a spender's allowance of linked tokens, on behalf of the owner

```js
// Enable the SDK
const apiKey = '7FJF5YK-WV1M90Y-G25V2MW-FG2ZMDV';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const address = '0x00408e1Ae7F5E590FAed44aE2cee5a9C23CA683d';
const asset = await window.aztec.zkAsset(address);

// Get the linkedToken balance
const tokenAllowance = await asset.allowanceOfLinkedToken();
console.info({ tokenAllowance });
```
