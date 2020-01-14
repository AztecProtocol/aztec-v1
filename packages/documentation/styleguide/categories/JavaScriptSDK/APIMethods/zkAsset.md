```js
// Enable the SDK
const apiKey = '7FJF5YK-WV1M90Y-G25V2MW-FG2ZMDV';
const result = await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const assetAddress = '0x7Fd548E8df0ba86216BfD390EAEB5026adCb5B8a';
const asset = await window.aztec.zkAsset(assetAddress);

console.info({ asset });
```
