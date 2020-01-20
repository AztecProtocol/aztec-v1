import gql from 'graphql-tag';
import insertVariablesToGql from '~/utils/insertVariablesToGql';
import actionModel from '~/database/models/action';
import GraphQLService from '../services/GraphQLService';
import getDomainFromUrl from '~/utils/getDomainFromUrl';
import {
    errorToActionMap,
} from '~/config/action';

export const updateActionState = async (action) => {
    const timestamp = Date.now();
    const {
        data,
    } = action;
    const {
        site,
    } = data || {};
    const newAction = {
        ...action,
        data,
        site,
        timestamp,
    };
    await actionModel.set(newAction);
    return newAction;
};

export const addDomainData = ({
    data,
    senderId,
    requestId,
    origin,
    ...rest
}) => ({
    domain: getDomainFromUrl(origin),
    senderId,
    requestId,
    origin,
    data,
    ...rest,
});

export const handleQuery = async ({
    domain,
    data: {
        args,
    } = {},
    query,
    mutation,
    requestId,
}) => {
    let type = 'query';

    if (mutation) {
        type = 'mutation';
    }
    // we always want the domain to be from the sender so the user can't fake this
    const graphQuery = insertVariablesToGql(
        mutation || query,
        {
            domain,
            ...args,
        },
    );

    const response = await GraphQLService[type]({
        [type]: gql(`${type} {${graphQuery}}`),
        args,
    });

    return {
        response,
        requestId,
    };
};

export const generateResponseCode = ({ response }, uiError, timeout) => {
    const queryName = Object.keys(response)
        .find(name => !!response[name].error);
    const errorData = queryName ? response[queryName].error : false;
    if (response && !errorData) {
        return 200;
    }
    if (errorData && errorToActionMap[errorData.key]) {
        // this is an auth error so need to show UI
        return 401;
    }

    if (uiError) {
        return 403;
    }
    if (timeout) {
        return 408;
    }
    return 500;
};

export const generateResponseError = ({ response, requestId }) => {
    const queryName = Object.keys(response)
        .find(name => !!response[name].error);
    const errorData = queryName ? response[queryName].error : false;
    return {
        type: errorToActionMap[errorData.key],
        timestamp: Date.now(),
        data: {
            requestId,
            response: JSON.parse(errorData.response),
        },
    };
};
