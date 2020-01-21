```js
// Enable the SDK
const apiKey = '7FJF5YK-WV1M90Y-G25V2MW-FG2ZMDV';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const address = '0x7Fd548E8df0ba86216BfD390EAEB5026adCb5B8a';
const asset = await window.aztec.zkAsset(address);
console.info({ asset });

// Deposit funds into the ZkAsset
const addressToDeposit = '0xD4CD0b1EF54E8E4D73f68b01b5ccc125b13E3d1e';
const depositAmount = 50;
await asset.deposit(
  [
    {
      addressToDeposit,
      amount: depositAmount,
    }
  ]
  {},
);

// Withdraw funds, to a different address
const addressToWithdraw = '0x67b4cd8fc283deb79d3b99da349dae745e5ca98a';
const withdrawAmount = 10;
await asset.withdraw([
  {
    addressToWithdraw,
    amount: withdrawAmount,
  }
], {})
```
