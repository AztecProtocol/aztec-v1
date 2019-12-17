import {
    GSNProvider,
} from '@openzeppelin/gsn-provider';
import Web3Service from '~/helpers/Web3Service';
import retrieveSigningInfo from '~utils/retrieveSigningInfo';
import approveFunction from '~utils/approveGSNFunction';
import { getProviderUrl } from '~utils/network';

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
        const {
            address,
        } = Web3Service.account;
        const signingInfo = await retrieveSigningInfo(address);
        const providerUrl = getProviderUrl(Web3Service.networkId);
        const gsnProvider = new GSNProvider(providerUrl, {
            pollInterval: 1 * 1000,
            signKey: signingInfo.privateKey,
            approveFunction: approveFunction(query, connection),
        });
        const receipt = await Web3Service
            .useContract(contract)
            .method(method)
            .useGSN({
                signingInfo,
                gsnProvider,
            })
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
