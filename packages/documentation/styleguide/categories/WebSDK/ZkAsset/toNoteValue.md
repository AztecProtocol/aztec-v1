## Examples

```js
const zkDaiAddress = '';
const asset = await window.aztec.zkAsset(zkDaiAddress);

console.info('Scaling factor:', asset.scalingFactor);
// Scaling factor: 10000000000000000

console.info('Token decimals:', asset.token.decimals);
// Token decimals: 18

const noteValue = asset.toNoteValue('12.34');
console.info('Note value:', noteValue);
// Note value: 1234
```
