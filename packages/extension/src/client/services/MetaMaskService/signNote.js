import { signer } from 'aztec.js';
import utils from '@aztec/dev-utils';

const {
    constants: {
        eip712,
    },
    proofs,
} = utils;


export default ({
    noteHash,
    sender,
    challenge,
    assetAddress,
}) => {
    const domain = signer.generateZKAssetDomainParams(assetAddress);
    const schema = eip712.JOIN_SPLIT_SIGNATURE;
    const message = {
        noteHash,
        proof: proofs.JOIN_SPLIT_PROOF,
        challenge,
        sender,
    };
    const data = JSON.stringify({
        ...schema,
        message,
        domain,
    });

    return data;
};
