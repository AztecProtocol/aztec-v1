## Examples
### Get the total supply of the linkedToken

```js
// Enable the SDK
const apiKey = '071MZEA-WFWMGX4-JJ2C5C1-AVY458F';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const address = '0x70c23EEC80A6387464Af55bD7Ee6C8dA273C4fb4';
const asset = await window.aztec.zkAsset(address);

// Get the linked token's total suppply
const totalSupply = await asset.totalSupplyOfLinkedToken();
console.info({ totalSupply });
```
