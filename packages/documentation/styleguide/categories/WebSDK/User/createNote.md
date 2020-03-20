## Examples

### Create an AZTEC note

```js
// Fetch the user
const thirdPartyAddress = '';
const user = await window.aztec.user(thirdPartyAddress);
console.info('user:', user);

// Create a note
const note = await user.createNote(10);
console.info('note:', note);
```

### Create an AZTEC note and share it with another user

```js
const currentUser = window.aztec.account;
const thirdPartyAddress = '';
const note = await currentUser.createNote(10, [thirdPartyAddress]);
console.info('note:', note);
```
