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

### An `Account` instance for a registered AZTEC user has the following data and methods on it:

- _registered_ (Boolean)
- _address_ (Address)
- _linkedPublicKey_ (String)
- _spendingPublicKey_ (String)
- [`async createNote()`](/#/SDK/user/.createNote)
- [`async encryptMessage()`](/#/SDK/user/.encryptMessage)
- [`async decryptMessage()`](/#/SDK/user/.decryptMessage)
