## Examples
### Convert 50 ERC20 tokens into zero-knowledge notes, owned by the user. 
Place your Ethereum address in the `user` variable
```js
// Get the injected address [change to use a different address]
const userAddress = window.ethereum.selectedAddress;

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
const depositAmount = 50;
await asset.deposit(
  [
    {
      to: userAddress,
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
// Get the injected address [change to use a different address]
const thirdParty = window.ethereum.selectedAddress;

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
