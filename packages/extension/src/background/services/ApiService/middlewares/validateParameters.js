import cloneDeep from 'lodash/cloneDeep';
import {
    warnLog,
} from '~/utils/log';
import {
    argsError,
} from '~/utils/error';
import schemas from '../schemas';

const formatError = (error) => {
    const msg = error.toString();
    return msg.replace(/^Error:/i, '').trim();
};

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

    // validate will change args in place
    const errors = schema.validate(cloneDeep(args));
    if (errors && errors.length > 0) {
        return argsError('input.invalid', {
            messages: errors.map(formatError),
        });
    }

    return null;
}
