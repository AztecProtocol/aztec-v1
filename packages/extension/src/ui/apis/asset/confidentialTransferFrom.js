import utils from '@aztec/dev-utils';
import ConnectionService from '~/ui/services/ConnectionService';

const {
    proofs: {
        JOIN_SPLIT_PROOF,
    },
} = utils;

export default async function confidentialTransferFrom({
    assetAddress,
    proof,
    signature1 = '0x',
    signature2 = '0x',
    spender,
    isGSNAvailable,
}) {
    const proofData = proof.encodeABI(assetAddress);
    const transactionData = {
        contract: 'AccountRegistry',
        method: 'confidentialTransferFrom',
        data: [
            JOIN_SPLIT_PROOF,
            assetAddress,
            proofData,
            spender,
            signature1,
            signature2,
        ],
    };
    const response = isGSNAvailable
        ? await ConnectionService.sendTransaction(transactionData)
        : await ConnectionService.post({
            action: 'metamask.send',
            data: transactionData,
        });

    return {
        ...response,
        success: !!(response && response.success),
    };
}
