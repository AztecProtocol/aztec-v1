`ZkAssets` can be thought of as a confidential version of an ERC20 contract. Once the SDK is enabled, you can then interact directly with any `ZkAsset`, by specifiying the address of the deployed asset and calling the `window.aztec.zkAsset()` method as below:

```js
// Enable the SDK
const apiKey = '7FJF5YK-WV1M90Y-G25V2MW-FG2ZMDV';
const result = await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const assetAddress = '0x7Fd548E8df0ba86216BfD390EAEB5026adCb5B8a';
const asset = await window.aztec.zkAsset(assetAddress);

console.info(asset);
```

The `zkAsset` has the following methods on it:
- `async zkAsset.balance()`
- `async zkAsset.fetchNotesFromBalance()`
- `async zkAsset.deposit()`
- `async zkAsset.send()`
- `async zkAsset.withdraw()`



