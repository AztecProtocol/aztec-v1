`ZkAssets` can be thought of as a confidential version of an ERC20 contract. Once the SDK is enabled, you can then interact directly with any `ZkAsset`, by specifiying the address of the deployed asset and calling the `window.aztec.zkAsset()` method as below:

```js
// Enable the SDK
const apiKey = '071MZEA-WFWMGX4-JJ2C5C1-AVY458F';
const result = await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);

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




