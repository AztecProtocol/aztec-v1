import insertVariablesToGql from '~utils/insertVariablesToGql';
import Web3Service from '../services/Web3Service';
import postToContentScript from './postToContentScript';
import ApiError from './ApiError';

const handleResponse = (response) => {
    // if (response.error) {
    //     throw new ApiError(response);
    // }
    // const failedQuery = Object.keys(response)
    //     .find(queryName => !!response[queryName].error);
    // if (failedQuery) {
    //     console.log(new ApiError(response[failedQuery]));
    //     throw new ApiError(response[failedQuery]);
    // }

    return response;
};

export default async function query(queryStr) {
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
            query: insertVariablesToGql(
                queryStr,
                {
                    currentAddress: address || '',
                },
            ),
        },
        handleResponse,
    );
}
