Refresh the balance of the asset to the latest indexed version

__Arguments__
_None_

## Examples
```js
// Enable the SDK
const apiKey = '7FJF5YK-WV1M90Y-G25V2MW-FG2ZMDV';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const address = '0x7Fd548E8df0ba86216BfD390EAEB5026adCb5B8a';
const asset = await window.aztec.zkAsset(address);
const initialBalance = await asset.balance();

// Deposit funds into the ZkAsset
const userAddress = '0xD4CD0b1EF54E8E4D73f68b01b5ccc125b13E3d1e';
const depositAmount = 50;
await asset.deposit(
  [
    {
      to: userAddress,
      amount: depositAmount,
    }
  ]
  {},
);

const incorrectBalance = await asset.balance();
console.info({ incorrectBalance });

// Refresh the balance of the asset
await asset.refresh();
const newBalance = await asset.balance();
console.info({ newBalance });
```
