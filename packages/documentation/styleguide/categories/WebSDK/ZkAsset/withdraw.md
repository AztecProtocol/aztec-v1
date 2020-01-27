Withdraw zero-knowledge funds into public form - convert notes into public ERC20 tokens

## Examples
### Convert 10 units of zero-knowledge notes into 10 ERC20 tokens, to be owned by user
```js
// Enable the SDK
const apiKey = '7FJF5YK-WV1M90Y-G25V2MW-FG2ZMDV';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const address = '0x7Fd548E8df0ba86216BfD390EAEB5026adCb5B8a';
const asset = await window.aztec.zkAsset(address);
console.info({ asset });

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

// Withdraw funds, to a different address
const withdrawAmount = 10;
await asset.withdraw([
  {
    to: userAddress,
    amount: withdrawAmount,
  }
], {})
```

### Convert 10 units of zero-knowledge notes into 10 ERC20 tokens, to be owned by a third part
```js
// Enable the SDK
const apiKey = '7FJF5YK-WV1M90Y-G25V2MW-FG2ZMDV';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const address = '0x7Fd548E8df0ba86216BfD390EAEB5026adCb5B8a';
const asset = await window.aztec.zkAsset(address);

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

// Withdraw funds, to a different address
const thirdPartyAddress = '0xc647637aeb0f2ac4d98037955091ff66f6d8a235';
const withdrawAmount = 10;
await asset.withdraw([
  {
    to: thirdPartyAddress,
    amount: withdrawAmount,
  }
], {})
```
