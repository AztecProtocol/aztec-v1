import filterStream from '~utils/filterStream';
import {
    dataError,
} from '~utils/error';

import proofValidation from './proofValidation';


const validateProof = async (query) => {
    // we need to validate the resultant note owners
    const {
        data: {
            args: {
                proofType,
                ...data
            },
        },
    } = query;

    const validatedProofInputs = proofValidation(proofType, data);
    if (!(validatedProofInputs instanceof Error)) {
        return data;
    }
    throw new Error(validatedProofInputs);
};

const proofUi = (query, connection) => async () => {
    connection.UiActionSubject.next({
        type: 'ui.asset.prove',
        requestId: query.requestId,
        clientId: query.clientId,
        data: {
            ...query.args,
        },
    });

    return filterStream('UI_RESPONSE', query.requestId, connection.MessageSubject.asObservable());
    // we now know the UI has completed
};


const triggerProofUi = async (query, connection) => {
    await validateProof(query, connection)
        .then(proofUi(query, connection));
};


export default triggerProofUi;
