import {
    uiReturnEvent,
} from '~/config/event';
import filterStream from '~utils/filterStream';
import validateParameters from './validateParameters';
import validateRequest from './validateRequest';
import fetchNotesFromBalance from './fetchNotesFromBalance';

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
        data: rest,
    });

    const resp = await filterStream(
        uiReturnEvent,
        query.requestId,
        connection.MessageSubject.asObservable(),
    );
    const {
        data,
    } = resp || {};

    return {
        ...query,
        data: {
            prove: data,
        },
    };
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

    const invalidParamsResp = validateParameters(proofType, data);
    if (invalidParamsResp) {
        return {
            ...query,
            data: invalidParamsResp,
        };
    }

    const invalidRequestResp = await validateRequest(proofType, data);
    if (invalidRequestResp) {
        return {
            ...query,
            data: invalidRequestResp,
        };
    }

    if (proofType === 'FETCH_NOTES_FROM_BALANCE') {
        const response = await fetchNotesFromBalance({
            ...data,
            assetId: data.assetAddress,
            domain: window.location.origin,
        });
        return {
            ...query,
            data: response,
        };
    }
    return proofUi(query, connection);
};

export default triggerProofUi;
