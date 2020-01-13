```js
// Enable the SDK
const apiKey = '7FJF5YK-WV1M90Y-G25V2MW-FG2ZMDV';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const address = '0x7Fd548E8df0ba86216BfD390EAEB5026adCb5B8a';
const asset = await window.aztec.zkAsset(address);

console.info({ asset });
const preDepositBalance = await asset.balance();
console.info({ preDepositBalance });

// Deposit funds into the ZkAsset
const to = '0xD4CD0b1EF54E8E4D73f68b01b5ccc125b13E3d1e';
const depositAmount = 50;
console.info('before deposit');
await asset.deposit(
  [
    {
      to,
      amount: depositAmount,
    },
  ],
  {},
);

console.info('succeeded in deposit');

const postDepositBalance = preDepositBalance + depositAmount;
console.info({ postDepositBalance });
```
