## Examples
### 1) Generate a proof that a note's value is equal to 10
```js
// Enable the SDK
const apiKey = '7FJF5YK-WV1M90Y-G25V2MW-FG2ZMDV';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const address = '0x00408e1Ae7F5E590FAed44aE2cee5a9C23CA683d';
const asset = await window.aztec.zkAsset(address);

const notes = await asset.fetchNotesFromBalance();
console.info({ notes });

```
