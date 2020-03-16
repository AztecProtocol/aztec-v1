import { signer } from 'aztec.js';
import utils from '@aztec/dev-utils';

const {
    constants: {
        eip712,
    },
} = utils;

export default ({
    spender,
    verifyingContract,
    allowed,
    expiry,
    nonce,
    chainId,
    holder,
}) => {
    const domain = signer.generateDAIDomainParams(chainId, verifyingContract);
    const schema = eip712.PERMIT_SIGNATURE;

    const message = {
        allowed,
        spender,
        holder,
        expiry,
        nonce,
    };

    const data = JSON.stringify({
        ...schema,
        message,
        domain,
    });

    return data;
};
