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
