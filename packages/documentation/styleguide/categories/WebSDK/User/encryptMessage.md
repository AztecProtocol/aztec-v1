## Examples

```js
const secret = "elephants can't jump";
const currentUser = window.aztec.account;
const encrypted = await currentUser.encryptMessage(secret);
console.info('encrypted:', encrypted);
```
