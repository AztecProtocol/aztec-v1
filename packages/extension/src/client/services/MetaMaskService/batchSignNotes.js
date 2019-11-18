import { signer } from 'aztec.js';
import utils from '@aztec/dev-utils';

const {
    constants: {
        eip712,
    },
    proofs,
} = utils;


export default ({
    noteHashes,
    sender,
    spenderApprovals,
    assetAddress,
}) => {
    const domain = signer.generateZKAssetDomainParams(assetAddress);
    const schema = eip712.MULTIPLE_NOTE_SIGNATURE;

    const message = {
        noteHashes,
        spender,
        spenderApprovals,
    };
    const data = JSON.stringify({
        ...schema,
        message,
        domain,
    });

    return data;
};
