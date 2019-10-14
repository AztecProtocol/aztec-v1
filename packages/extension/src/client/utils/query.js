import {
    clientEvent,
} from '~config/event';
import Web3Service from '../services/Web3Service';
import postToContentScript from './postToContentScript';
import ApiError from './ApiError';

const handleResponse = (response) => {
    const { error, ...rest } = response;
    console.log(response);
    if (error) {
        throw new ApiError(response);
    }
    const responseKey = Object.keys(response)
        .find(queryName => !!response[queryName]);
    if (rest[responseKey].error) {
        throw new ApiError(rest);
    }
    return rest[responseKey];
};

export default async function query({ type, args }) {
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
                currentAddress: address,
            },
        },
        handleResponse,
    );
}
