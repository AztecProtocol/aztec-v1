import {
    warnLog,
} from '~/utils/log';
import {
    argsError,
} from '~/utils/error';
import schemas from '../schemas';

export default function validateParameters(query, args) {
    let schema = schemas[query];
    if (query === 'constructProof') {
        const {
            proofType,
        } = args;
        schema = schema[proofType];

        if (!schema) {
            warnLog(`Schema for proof '${proofType}' is not defined.`);
            return null;
        }
    } else if (!schema) {
        warnLog(`Schema for query '${query}' is not defined.`);
        return null;
    }

    const errorMsg = schema.validate(args);
    if (errorMsg) {
        const errorResp = argsError('input.invalid');
        return {
            ...errorResp,
            error: {
                ...errorResp.error,
                message: errorMsg,
            },
        };
    }

    return null;
}
