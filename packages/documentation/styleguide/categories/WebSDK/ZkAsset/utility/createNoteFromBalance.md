## Examples

### Create a note worth 10 from the use's balance.

```js
const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);

const note = await asset.createNoteFromBalance(10);
console.info({ note });
```
