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
    signature = '0x',
    spender,
}) {
    const proofData = proof.encodeABI(assetAddress);
    const response = await ConnectionService.sendTransaction({
        contract: 'AccountRegistry',
        method: 'confidentialTransferFrom',
        data: [
            JOIN_SPLIT_PROOF,
            assetAddress,
            proofData,
            spender,
            signature,
        ],
    });

    return {
        ...response,
        success: !!(response && response.txReceipt),
    };
}
