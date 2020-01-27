import { signer } from 'aztec.js';
import utils from '@aztec/dev-utils';

const {
    constants: {
        eip712,
    },
} = utils;


export default ({
    proofHash,
    spender,
    assetAddress,
    approval,
}) => {
    const domain = signer.generateZKAssetDomainParams(assetAddress);
    const schema = eip712.PROOF_SIGNATURE;

    const message = {
        proofHash,
        spender,
        approval,
    };

    const data = JSON.stringify({
        ...schema,
        message,
        domain,
    });

    return data;
};
