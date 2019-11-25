import {
    unknownError,
} from '~/utils/error';
import * as verifiers from './requestVerifiers';

export default async function validateRequest(proofType, params) {
    const verifier = verifiers[proofType];
    if (!verifier) {
        return null;
    }

    let error;
    try {
        error = await verifier(params);
    } catch (e) {
        error = unknownError(e.message, e);
    }

    return error || null;
}
