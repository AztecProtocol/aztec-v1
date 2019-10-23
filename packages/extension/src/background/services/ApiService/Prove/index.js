import filterStream from '~utils/filterStream';

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
    const {
        data: {
            args: {
                proofType,
                ...rest
            },
        },
    } = query;
    connection.UiActionSubject.next({
        type: `ui.asset.prove.${proofType.toLowerCase()}`,
        requestId: query.requestId,
        clientId: query.clientId,
        data: {
            response: {
                ...rest,
                requestId: query.requestId,
            },
        },
    });

    const resp = await filterStream('UI_RESPONSE', query.requestId, connection.MessageSubject.asObservable());
    return {
        ...query,
        response: {
            prove: {
                prove: {
                    ...resp.data,
                },
            },
        },
    };
    // we now know the UI has completed
};


const triggerProofUi = async (query, connection) => validateProof(query, connection)
    .then(proofUi(query, connection));


export default triggerProofUi;
