## Examples

### Confidentially send value of 30units to another Ethereum address.

```js
const thirdPartyAddress = '';

const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);

const balanceBeforeSend = await asset.balance();
console.info({ balanceBeforeSend });

// Send funds
const sendAmount = 30;
const response = await asset.send([
    {
        to: thirdPartyAddress,
        amount: sendAmount,
    },
]);
console.info(response);

const balanceAfterSend = await asset.balance();
console.info({ balanceAfterSend });
```
### Confidentially send value of 30units to an Ethereum smart contract.

In order to make AZTEC notes programmable, they need to be owned by a smart contract. This allows the smart contract to confidentially approve the spending of notes based on other factors or proofs, *enforced on-chain*. By default the SDK will prevent the user from sending notes to an Ethereum address, that is not registered to the SDK, to prevent the recipeint being unable to decrypt / spend the note. By passing in a flag this can be overidden, as long as there is at least one registered user in the `userAccess` array.

dApps implementing streaming, DEX's and other complex STO's will require this flow. 

```js

const zkAssetAddress = '';
const contractAddress = zkAssetAddress;
const asset = await window.aztec.zkAsset(zkAssetAddress);
const userAddress = window.aztec.account.address;

const balanceBeforeSend = await asset.balance();
console.info({ balanceBeforeSend });

// Send funds
const sendAmount = 30;
const response = await asset.send([
    {
        to: contractAddress,
        amount: sendAmount,
        aztecAccountNotRequired: true
    },
], {
  userAccess: [userAddress]
});
console.info(response);

const balanceAfterSend = await asset.balance();
console.info({ balanceAfterSend });
```

