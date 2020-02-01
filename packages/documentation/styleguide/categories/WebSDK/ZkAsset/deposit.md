## Examples
### Convert 50 ERC20 tokens into zero-knowledge notes, owned by the user. 
Place your Ethereum address in the `user` variable
```js
// Enable the SDK
const apiKey = '071MZEA-WFWMGX4-JJ2C5C1-AVY458F';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const address = '0x70c23EEC80A6387464Af55bD7Ee6C8dA273C4fb4';
const asset = await window.aztec.zkAsset(address);
console.info( asset );


const userPreDepositBalance = await asset.balance();
console.info({ userPreDepositBalance });

// Deposit funds into the ZkAsset
const user = ''; // [place your Ethereum address here]
const depositAmount = 50;
await asset.deposit(
  [
    {
      to: user,
      amount: depositAmount,
    },
  ],
  {},
);

const userPostDepositBalance = userPreDepositBalance + depositAmount;
console.info({ userPostDepositBalance });
```

### Give a third party zero-knowledge notes worth 50 ERC20 tokens

```js
// Enable the SDK
const apiKey = '071MZEA-WFWMGX4-JJ2C5C1-AVY458F';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const address = '0x70c23EEC80A6387464Af55bD7Ee6C8dA273C4fb4';
const asset = await window.aztec.zkAsset(address);
console.info( asset );


const preDepositBalance = await asset.balance();
console.info({ preDepositBalance });

// Deposit funds into the ZkAsset
const thirdParty = '0xD4CD0b1EF54E8E4D73f68b01b5ccc125b13E3d1e';
const depositAmount = 50;
await asset.deposit(
  [
    {
      to: thirdParty,
      amount: depositAmount,
    },
  ],
  {},
);

const postDepositBalance = preDepositBalance + depositAmount;
console.info({ postDepositBalance });
```
