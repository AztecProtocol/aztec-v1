The `aztec.user` api takes an Ethereum address and returns an `Account` instance, which contains information about a user if they have registered an AZTEC account on chain.

```js
const thirdPartyAddress = '';
const user = await window.aztec.user(thirdPartyAddress);
console.info('user:', user);
```

Once the sdk is enabled, you can also get the account of current user from `aztec.account`.

```js
console.info('currentUser:', window.aztec.account);
```

A valid `Account` instance for a registered AZTEC user has the following data and methods on it:

- `user.address`
- `user.linkedPublicKey`
- `user.spendingPublicKey`
- `user.registered`
- [`async user.createNote(value, userAccess)`](/#/SDK/user/.createNote)
- [`async user.encryptMessage(message)`](/#/SDK/user/.encryptMessage)
- [`async user.decryptMessage(message)`](/#/SDK/user/.decryptMessage)
