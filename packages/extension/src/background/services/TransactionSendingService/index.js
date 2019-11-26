import Web3Service from '~/helpers/Web3Service';

import getGsnConfig from '~utils/getGSNConfig';

const sendTransaction = async (query, connection) => {
    const {
        data: {
            contract,
            method,
            params,
        },
        responseId,
    } = query;

    try {
        const gsnConfig = await getGsnConfig();
        const receipt = await Web3Service
            .useContract(contract)
            .method(method, true)
            .useGSN(gsnConfig)
            .send(...params);
        return {
            ...query,
            data: {
                txReceipt: receipt,
            },
            responseId,
        };
    } catch (error) {
        return {
            ...query,
            data: {
                error,
            },
        };
    }
};

// TODO change this to use the gas station network

export default {
    sendTransaction,
};
