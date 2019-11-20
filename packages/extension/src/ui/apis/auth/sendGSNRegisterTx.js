import ConnectionService from '~ui/services/ConnectionService';
import {
    AZTECAccountRegistryGSN,
} from '~/config/contracts';

export default async function sendGSNRegisterTx({
    address,
    linkedPublicKey,
    spendingPublicKey,
    signature,
}) {
    const {
        txReceipt,
        error,
    } = await ConnectionService.sendTransaction({
        contract: AZTECAccountRegistryGSN.name,
        method: 'registerAZTECExtension',
        data: [
            address,
            linkedPublicKey,
            spendingPublicKey,
            signature,
        ],
    }) || {};

    const {
        blockNumber,
    } = txReceipt || {};

    return {
        blockNumber,
        error,
    };
}
