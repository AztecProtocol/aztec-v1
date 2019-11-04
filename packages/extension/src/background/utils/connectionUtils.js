import browser from 'webextension-polyfill';
import gql from 'graphql-tag';
import insertVariablesToGql from '~utils/insertVariablesToGql';
import actionModel from '~database/models/action';
import GraphQLService from '../services/GraphQLService';
import getDomainFromUrl from '~/utils/getDomainFromUrl';
import {
    errorToActionMap,
} from '~config/action';

export const updateActionState = async (action) => {
    const timestamp = Date.now();
    const {
        data: {
            response,
        },
    } = action;
    const {
        site,
    } = response || {};
    const newAction = {
        ...action,
        data: response,
        site,
        timestamp,
    };
    await actionModel.set(newAction);
    return newAction;
};


export const openPopup = ({ timestamp }) => {
    const popupURL = browser.extension.getURL('pages/popup.html');
    const { width, height } = window.screen;
    const popup = window.open(`${popupURL}?id=${timestamp}`, '_blank', `left=${(width - 340) / 2},height=550,width=340,top=${(height - 550) / 2},status=0,titlebar=0,resizable=0,menubar=0,location=0,toolbar=0`);
    return popup;
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
