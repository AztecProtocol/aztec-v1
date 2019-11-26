import {
    unknownError,
} from '~/utils/error';
import verifiers from '../requestVerifiers';

export default async function validateRequest(query, args) {
    let verifier = verifiers[query];
    if (query === 'constructProof'
        && verifier
    ) {
        const {
            proofType,
        } = args;
        verifier = verifier[proofType];
    }

    if (!verifier) {
        return null;
    }

    let error;
    try {
        error = await verifier(args);
    } catch (e) {
        error = unknownError(e.message, e);
    }

    return error || null;
}
