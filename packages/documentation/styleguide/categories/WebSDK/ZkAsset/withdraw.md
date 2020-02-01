## Examples
### Convert 10 units of zero-knowledge notes into 10 ERC20 tokens, to be owned by user
Place your Ethereum address in the `user` variable
```js
// Enable the SDK
const apiKey = '071MZEA-WFWMGX4-JJ2C5C1-AVY458F';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const address = '0x70c23EEC80A6387464Af55bD7Ee6C8dA273C4fb4';
const asset = await window.aztec.zkAsset(address);
console.info({ asset });

// Deposit funds into the ZkAsset
const user = '';
const depositAmount = 50;
await asset.deposit(
  [
    {
      to: user,
      amount: depositAmount,
    }
  ]
  {},
);

// Withdraw funds, to a different address
const withdrawAmount = 10;
await asset.withdraw([
  {
    to: user,
    amount: withdrawAmount,
  }
], {})
```

### Convert 10 units of zero-knowledge notes into 10 ERC20 tokens, to be owned by a third party
```js
// Enable the SDK
const apiKey = '071MZEA-WFWMGX4-JJ2C5C1-AVY458F';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const address = '0x70c23EEC80A6387464Af55bD7Ee6C8dA273C4fb4';
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
