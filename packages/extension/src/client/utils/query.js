import {
    clientEvent,
} from '~config/event';
import Web3Service from '~/client/services/Web3Service';
import ApiError from './ApiError';


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

    const response = await window.aztec.query(
        {
            type: clientEvent,
            query: type,
            args: {
                ...args,
                currentAddress: address,
                domain: window.location.origin,
            },
        },
    );

    const { error, ...rest } = response;
    if (error) {
        throw new ApiError(response);
    }
    const responseKey = Object.keys(response)
        .find(queryName => !!response[queryName]);
    if (rest[responseKey].error) {
        throw new ApiError(rest);
    }
    return rest[responseKey];
}
