## Examples

### ZkAsset with scaling factor equals 1:

```js
const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);

console.info('Scaling factor:', asset.scalingFactor);
// Scaling factor: 1

console.info('Token decimals:', asset.token.decimals);
// Token decimals: 0

const noteValue = asset.toNoteValue('1234');
console.info('Note value:', noteValue);
// Note value: 1234
```

### ZkAsset with scaling factor more than 1:

```js
const zkDaiAddress = '';
const asset = await window.aztec.zkAsset(zkDaiAddress);

console.info('Scaling factor:', asset.scalingFactor);
// Scaling factor: 10000000000000000

console.info('Token decimals:', asset.token.decimals);
// Token decimals: 18

const noteValue = asset.toNoteValue('1234');
console.info('Note value:', noteValue);
// Note value: 123400
```
