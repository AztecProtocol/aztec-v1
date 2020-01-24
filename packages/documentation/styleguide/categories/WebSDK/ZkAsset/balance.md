Determine the balance of an asset

__Arguments__
_None_

__Returns__
- {Number} Balance of the asset

&nbsp  

## Examples
### Get a user's balance, held by a ZkAsset
```js
// Enable the SDK
const apiKey = '7FJF5YK-WV1M90Y-G25V2MW-FG2ZMDV';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const address = '0x7Fd548E8df0ba86216BfD390EAEB5026adCb5B8a';
const asset = await window.aztec.zkAsset(address);

const assetBalance = await asset.balance();
console.info({ assetBalance });
```
