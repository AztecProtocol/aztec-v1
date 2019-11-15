import {
    uiReturnEvent,
} from '~/config/event';
import filterStream from '~utils/filterStream';
import proofValidation from './proofValidation';
import fetchNotesFromBalance from './fetchNotesFromBalance';

const validateProof = (proofType, data) => {
    // we need to validate the resultant note owners
    const validatedProofInputs = proofValidation(proofType, data);
    if (!(validatedProofInputs instanceof Error)) {
        return data;
    }
    throw new Error(validatedProofInputs);
};

const proofUi = async (query, connection) => {
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

    const resp = await filterStream(
        uiReturnEvent,
        query.requestId,
        connection.MessageSubject.asObservable(),
    );
    const {
        data,
    } = resp.data || {};
    return {
        ...query,
        response: {
            prove: data,
        },
    };
    // we now know the UI has completed
};

const triggerProofUi = async (query, connection) => {
    const {
        data: {
            args: {
                proofType,
                ...data
            },
        },
    } = query;
    try {
        validateProof(proofType, data);
    } catch (error) {
        return error;
    }
    if (proofType === 'FETCH_NOTES_FROM_BALANCE') {
        const response = await fetchNotesFromBalance({
            ...data,
            assetId: data.assetAddress,
            domain: window.location.origin,
        });
        return {
            ...query,
            response,
        };
    }
    return proofUi(query, connection);
};

export default triggerProofUi;
