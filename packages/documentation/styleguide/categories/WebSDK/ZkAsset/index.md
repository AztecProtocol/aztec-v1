`ZkAssets` can be thought of as a confidential version of an ERC20 contract. Once the SDK is enabled, you can then interact directly with any `ZkAsset`, by specifiying the address of the deployed asset and calling the `window.aztec.zkAsset()` method as below:

```js
// Enable the SDK
const apiKey = '7FJF5YK-WV1M90Y-G25V2MW-FG2ZMDV';
const result = await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const assetAddress = '0x00408e1Ae7F5E590FAed44aE2cee5a9C23CA683d';
const asset = await window.aztec.zkAsset(assetAddress);

console.info(asset);
```

The `zkAsset` has the following methods on it:
- `async zkAsset.balance()`
- `async zkAsset.deposit()`
- `async zkAsset.send()`
- `async zkAsset.withdraw()`
- `async zkAsset.createNotesFromBalance()`
- `async zkAsset.fetchNotesFromBalance()`
- `async zkAsset.allowanceOfLinkedtoken()`
- `async zkAsset.totalSupplyOfLinkedtoken()`





