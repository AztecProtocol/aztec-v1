import secp256k1 from '@aztec/secp256k1';
import decodePrivateKey from '~/background/utils/decodePrivateKey';
import AuthService from '~/background/services/AuthService';
import ConnectionService from '~/ui/services/ConnectionService';

export default async function registerAccountOnChain({
    address,
    linkedPublicKey,
    spendingPublicKey,
    signature,
    isGSNAvailable,
}) {
    const keyStore = await AuthService.getKeyStore();
    const {
        pwDerivedKey,
    } = await AuthService.getSession(address) || {};
    const privateKey = '0x'.concat(decodePrivateKey(keyStore, pwDerivedKey));
    const {
        address: aliasAddress,
    } = secp256k1.accountFromPrivateKey(privateKey);

    const transactionData = {
        contract: 'AccountRegistry',
        method: 'registerAZTECExtension',
        data: [
            address,
            aliasAddress,
            linkedPublicKey,
            spendingPublicKey,
            signature,
        ],
    };

    const response = isGSNAvailable
        ? await ConnectionService.sendTransaction(transactionData)
        : await ConnectionService.post({
            action: 'metamask.send',
            data: transactionData,
        });

    const {
        txReceipt,
        error,
    } = response || {};

    const {
        blockNumber,
    } = txReceipt || {};

    return {
        blockNumber,
        error,
    };
}
