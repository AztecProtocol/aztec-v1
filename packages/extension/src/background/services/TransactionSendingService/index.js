import {
    GSNProvider,
} from '@openzeppelin/gsn-provider';
import Web3Service from '~/helpers/Web3Service';
import {
    errorLogProduction,
} from '~/utils/log';
import retrieveSigningInfo from '~/utils/retrieveSigningInfo';
import { getProviderUrl } from '~/utils/network';
import makeApproveFunction from './makeApproveFunction';

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
            approveFunction: makeApproveFunction(query, connection),
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
    } catch (e) {
        errorLogProduction(e);
        let error;
        if (e.message.match(/relayer/)) {
            error = {
                key: 'transaction.gsn.error.relayer',
            };
        } else {
            error = {
                key: 'transaction.gsn.error',
            };
        }
        return {
            ...query,
            data: {
                error,
            },
        };
    }
};

export default {
    sendTransaction,
};
