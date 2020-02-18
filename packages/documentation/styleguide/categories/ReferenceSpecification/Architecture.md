The AZTEC protocol enables efficient confidential transactions through the construction of AZTEC-compatible zero-knowledge proofs. Specifically, the protocol focuses on optimizing confidential *settlement* and other forms of value-transfer

The protocol is architected to optimize for the following factors:  

1. customizability - AZTEC assets must have confidential transaction semantics that can be modified to suit the ends of the user  
2. interoperability - different AZTEC assets must conform to a standard interface that dApps can use to settle confidential transactions  
3. efficiency - no redundant computation should be performed when verifying confidential transactions  
4. qualified upgradability - as improvements are made to the underlying cryptographic protocols, and additional proof systems are added into AZTEC, existing confidential assets should be able to enjoy the benefits of these improvements. At the same time, users of AZTEC must be able to have confidence that they can opt out of these upgrades - that the verification algorithms used to validate existing zero-knowledge proofs are immutable. In addition, as upgrades are made to the logic of note registries, user must have the option to benefit from these upgrades whilst also being able to opt out.
## The AZTEC Cryptography Engine  

The focus of our protocol is this cryptography engine (ACE.sol). ACE is the ultimate arbiter of the correctness of an AZTEC zero-knowledge proof. AZTEC assets subscribe to ACE and call on it to validate proofs.  

ACE converts zero-knowledge proof data into *instructions* - directions on the following:  

1. AZTEC notes to be created  
2. AZTEC notes to be destroyed  
3. Public tokens that need to be transferred  

Internally, ACE will create a unique representation of each proof instruction and store it  

## ABI encoding and AZTEC data 'types'  

The nature of zero-knowledge cryptography means that a significant volume of data is processed on-chain in the form of zero-knowlege proof *inputs* and zero-knowledge proof *outputs*.  

Because using structs in external functions is still an experimental feature, the AZTEC protocol defines its own ABI encoding for struct-like data types. These objects are represented by the `bytes` type, where the contents of the bytes array contains data that is formatted according to the AZTEC protocol's ABI specification.  

### AZTEC note ABI

One key feature of ACE is the ability to support multiple note 'types'. Different note types enable the engine to support zero-knowledge proofs that use different techniques to represent encrypted value.

For example, the currently implemented basic AZTEC note is the most efficient way to represent encrypted value, however it's UTXO-like form may be unsuitable for some applications. On the other hand, once implemented, ElGamal 'treasury' notes could be used to emulate a more traditional account-balance model, where the balance is encrypted.

All notes use the same basic structure, but with different publicKey values. Every AZTEC zero-knowlege proof explicitly defines the type of note that it utilizes. Under no circumstances should it be possible to use a note of the wrong 'type' in a zero-knowledge proof.

The ABI encoding of a note is as follows:

| Offset | Length | Name | Type | Description|
| ------ | ------ | -------- | --- | --- |
| 0x00   | 0x20   | id | uint256 | The 'type' identifier of the note |
| 0x20   | 0x20   | owner | address | Ethereum address of note owner |
| 0x40   | 0x20   | noteHash | bytes32 | Hash of the note's elliptic curve points: gamma and sigma |
| 0x60   | L_pub   | publicKey | bytes | The public key of the note, that is used to encrypt value |  
| 0x60 + L_pub | L_met | metaData | bytes | Note-specific metaData |

### Type 1: UTXO notes  

This is the default note type and currently used by the protocol. The ABI formatting of this note's `publicKey` is as follows:

| Offset | Length | Name | Type | Description|
| ------ | ------ | -------- | --- | --- |
| 0x00   | 0x20   | gamma | bytes32 | (compressed) bn128 group element |
| 0x20   | 0x20   | sigma | bytes32 | (compressed) bn128 group element |
| 0x40   | 0x21   | ephemeral key | bytes33 | ephemeral public key used to recover viewing key |  

### Type 2: El-Gamal treasury notes  

Treasury notes would enable a single 'account' to have their balance represented by a single treasury note (instead of a multitude of AZTEC UTXO-type notes). They are slightly more gas-expensive to use than AZTEC notes and are only used in a small subset of AZTEC zero-kowledge proofs.

| Offset | Length | Name | Type | Description|
| ------ | ------ | -------- | --- | --- |
| 0x00   | 0x20   | ownerPubKey | bytes32 | (compressed) bn128 group element that maps to the public key of the note's owner |
| 0x20   | 0x20   | noteEphemeralKey | bytes32 | (compressed) bn128 group element, a public key component of the note's ephemeral key |
| 0x40 | 0x20 | noteCommitment | bytes32 | (compressed) bn128 group element, the core El-Gamal commitment |
| 0x60   | -      | metaData | bytes | custom metaData associated with note |  

### metaData
`metaData` is a general purpose data field for notes. It is not used by the logic of AZTEC zero-knowlege proof validators, but instead contains implementation and application specific information that is broadcast by events involving a note.

The metaData schema has a default component and then an additional `customData` component that can be set if the associated functionality is required. By default, it is populated with the ephemeral key which can be used to recover a note viewing key (see below). Additional custom data can be appended by calling `note.setMetaData()`, which in the current AZTEC implementation allows: encrypted viewing keys, addresses approved to view the note and arbitrary app data to be appended. This results in a schema as below:

| Offset | Length | Name | Type | Description |  
| --- | --- | --- | --- | --- |  
| 0x00 | 0x21 | ephemeral key | bytes32 | ephemeral key used in key exchange |  
| 0x21 | 0x20 | approvedAddressesOffset | uint256 | relative offset to `address[] approvedAddresses`|  
| 0x41 | 0x20 | encryptedViewKeysOffset | uint256 | relative offset to `bytes[] encryptedViewKeys` |  
| 0x61 | 0x20 | appDataOffset | int256 | relative offset to `bytes[] appData` |  
| 0x81 | L_addresses | approvedAddresses | address[] | addresses approved for access to viewing key |  
| 0xa1 + L_addresses | L_encryptedViewKeys | encryptedViewKeys | bytes[] | encrypted viewing keys, for each address |  
| 0xa1 + L_addresses + L_encryptedViewKeys | L_appData | appData | bytes[] | application specific data |  

These various types of additional information are used to enable functionality which is described below and relies on an additional AZTEC package - `note-access` - to generate it.


#### Use 1: Recovering note viewing key using the ephemeral key
The `metaData` by default stores for every note an 'ephemeral' public key. This can be used by the `noteOwner` to derive the vieiwng key for their note and so be able to decrypt their note. 

The requirement of storing the 'ephemeral' key arises from the fact that each note viewing key is distinct, however it is also desirable that users should not have to manage a multitude of unique viewing keys. As well as this, if user A wishes to send user B a note, they should be able to derive a viewing key that A can recover and the process should be non-interactive.

The solution is to use a shared secret protocol, between an 'ephemeral' public/private key pair and the public key of the note owner. An extension of this protocol can be used to derive 'stealth' addresses, if the recipient has a stealth wallet. Currently, our V1 APIs use the basic shared secret protocol for ease of use (traditional Ethereum wallets can own these kinds of AZTEC notes). At the smart contract level, the protocol is forward-compatible with stealth addresses.

#### Use 2: Granting view key access
The `approvedAddresses` and `encryptedViewKeys` part of the `metaData` originates from a requirement of `noteOwner`s being able to grant third parties view access to their notes. 

The `approvedAddress` is an Ethereum address that is being granted view access, and the `encryptedViewKey` is the note's viewing key which has been encrypted using the public key of the `approvedAddress`. This makes it possible for the intended `approvedAddress` to decrypt the viewing key of the note (the `metaData` is broadcast on chain), and so able to view the note value. 

It should be noted that this is also the principle method by which `noteOwner`s are granted access to their viewing key, rather than the ephemeral key method. This technique is computationally efficient, whereas computing a viewing key from an `ephemeralKey` can take 10s of seconds.

A function exists on the `ZkAsset` contract to support the granting of view key access via this method - `zkAsset.updateNoteMetaData(bytes32 noteHash, bytes calldata metaData)`. This allows the `metaData` of an already existing note to be updated, and so grant viewing key access to additional parties. 

##### How the grant view access metaData is generated
Generating `encryptedViewKeys`, `approvedAddresses` and formatting them into the required schema is performed by an AZTEC helper module called `note-access`. 

This helper module exposes a key method `generateAccessMetaData()`:

``` static js
/**
 * @method generateAccessMetaData - grant an Ethereum address view access to a note
 * @param {Array} access - mapping between an Ethereum address and the linked public key. The specified address
 * is being granted access to the note
 * @param {String} noteViewKey - viewing key of the note
 */
export default function generateAccessMetaData(access, noteViewKey) {
    const noteAccess = access.map(({ address, linkedPublicKey }) => {
        const viewingKey = encryptedViewingKey(linkedPublicKey, noteViewKey);
        return {
            address,
            viewingKey: viewingKey.toHexString(),
        };
    });
    return addAccess('', noteAccess);
}
```

As inputs it takes an `access` object and the `noteViewKey`. The `access` object is used to define which Ethereum addresses are to be given view access to the note. The actual encryption is performed using the `tweetnacl` library: https://www.npmjs.com/package/tweetnacl, which itself makes use of elliptic curve Diffie-Hellman key exchange over Curve25519-XSalsa20-Poly1305.

The `generateAccessMetaData()` function is itself called on the `Note` class via the method:

``` static js
/** 
 * Grant an Ethereum address access to the viewing key of a note
 *
 * @param {Array} access mapping between an Ethereum address and the linked publickey
 * @returns {string} customData - customMetaData which will grant the specified Ethereum address(s)
 * access to a note
 */
grantViewAccess(access) {
    const noteViewKey = this.getView();
    const metaData = generateAccessMetaData(access, noteViewKey);
    this.setMetaData(metaData);
}
```

#### Use 3: Application specific data
Lastly, application specific data can be attached to the `metaData` of a note. This gives digital asset builders the option to attach custom data to an AZTEC note for an application specific utility. 
