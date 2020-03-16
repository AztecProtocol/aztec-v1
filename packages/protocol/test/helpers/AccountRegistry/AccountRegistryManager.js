const { signer } = require('aztec.js');
const devUtils = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const typedData = require('@aztec/typed-data');
const { keccak256 } = require('web3-utils');

const { ACCOUNT_REGISTRY_SIGNATURE } = devUtils.constants.eip712;

function createSignature(proxyAddress) {
    const { privateKey, address, publicKey } = secp256k1.generateAccount();
    const { address: AZTECaddress } = secp256k1.generateAccount();

    const linkedPublicKey = keccak256('0x01');
    const domain = signer.generateAccountRegistryDomainParams(proxyAddress);
    const message = {
        account: address,
        linkedPublicKey,
        AZTECaddress,
    };

    const encodedTypedData = typedData.encodeTypedData({
        domain,
        ...ACCOUNT_REGISTRY_SIGNATURE,
        message,
    });

    const signature = secp256k1.ecdsa.signMessage(encodedTypedData, privateKey);

    const r = signature[1];
    const s = signature[2].slice(2);
    const v = signature[0].slice(-2);
    const sig = r + s + v;

    return {
        address,
        linkedPublicKey,
        spendingPublicKey: `0x${publicKey.slice(4)}`,
        AZTECaddress,
        sig,
    };
}

module.exports = createSignature;
