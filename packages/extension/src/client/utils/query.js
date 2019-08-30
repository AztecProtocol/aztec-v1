import insertVariablesToGql from '~utils/insertVariablesToGql';
import {
    clientEvent,
} from '~config/event';
import toLowerCaseAddress from '~utils/address';
import Web3Service from '../services/Web3Service';
import postToContentScript from './postToContentScript';
import ApiError from './ApiError';

const handleResponse = (response) => {
    if (response.error) {
        throw new ApiError(response);
    }
    const failedQuery = Object.keys(response)
        .find(queryName => !!response[queryName].error);
    if (failedQuery) {
        throw new ApiError(response[failedQuery]);
    }

    return response;
};

export default async function query({ type, args }) {
    console.log(type, args, arguments);
    /* TODO
     * error {
     *      type
     *      key
     *      message
     *      response
     * }
     * should be inserted into every api's queryStr here
     */

    const {
        address,
    } = Web3Service.account || {};

    return postToContentScript(
        {
            type: clientEvent,
            query: type,
            args: {
                ...args,
                currentAddress: toLowerCaseAddress(address),
            },
        },
        handleResponse,
    );
}
