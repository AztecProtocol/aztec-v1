## Examples

```js
const zkDaiAddress = '';
const asset = await window.aztec.zkAsset(zkDaiAddress);

console.info('Scaling factor:', asset.scalingFactor);
// Scaling factor: 10000000000000000

console.info('Token decimals:', asset.token.decimals);
// Token decimals: 18

const noteValue = 123456789;

const tokenValue = asset.toTokenValue(noteValue);
console.info('ERC20 token value:', tokenValue);
// ERC20 token value: 1234567.89

const formattedTokenValue = asset.toTokenValue(noteValue, true);
console.info('Formatted ERC20 token value:', formattedTokenValue);
// Formatted ERC20 token value: '1,234,567.89'
```
