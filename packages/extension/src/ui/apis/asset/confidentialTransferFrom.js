import utils from '@aztec/dev-utils';
import ConnectionService from '~/ui/services/ConnectionService';
import Web3Service from '~/helpers/Web3Service';

const {
    proofs: {
        JOIN_SPLIT_PROOF,
    },

} = utils;

export default async function confidentialTransferFrom({
    assetAddress,
    proof,
    signature = '0x',
}) {
    const proofData = proof.encodeABI(assetAddress);
    const response = await ConnectionService.sendTransaction({
        contract: 'AccountRegistry',
        method: 'confidentialTransferFrom',
        data: [
            JOIN_SPLIT_PROOF,
            assetAddress,
            proofData,
            Web3Service.contracts.AccountRegistry.address,
            signature,
        ],
    });

    return {
        ...response,
        success: !!(response && response.txReceipt),
    };
}
