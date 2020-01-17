Send funds confidentially to another Ethereum address

__Arguments__
- {String} __to__: Ethereum address to which the user is sending zero-knowledge funds
- {Number} __amount__: units of value being transferred, where 1 unit is equivalent in value to 1 ERC20 token


## Examples
### Confidentially send value of 30units to another Ethereum address
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

// Send funds
const addressToSend = '0x228bd0d0ec5396ceaffcc2c5299d21f17d14207c';
const sendAmount = 30;
await asset.send([
  {
    addressToSend,
    amount: sendAmount,
  }
], {})
```
