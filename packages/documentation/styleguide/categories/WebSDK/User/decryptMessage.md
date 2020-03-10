## Examples

```js
const secret = "elephants can't jump";
const currentUser = window.aztec.account;

const encrypted = await currentUser.encryptMessage(secret);
console.info('encrypted:', encrypted);

const message = await currentUser.decryptMessage(encrypted);
console.info(`recovered message: "${message}"`);
// recovered message: "elephants can't jump"
```

Will not be able to decrypt a string encrypted for other users.

```js
const thirdPartyAddress = '';
const user = await window.aztec.user(thirdPartyAddress);

const secret = "jellyfish don't have brains";
const encrypted = await user.encryptMessage(secret);
console.info('encrypted:', encrypted);

const currentUser = window.aztec.account;
const recovered = await currentUser.decryptMessage(encrypted);
console.info(`recovered message: "${recovered}"`);
// recovered message: ""
```
