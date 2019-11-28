import axios from 'axios';
import { get } from '~/utils/storage';
import ClientActionService from '~background/services/ClientActionService';
import {
    actionRequestEvent,
} from '~config/event';


export default (query, connection) => async ({
    from,
    to,
    encodedFunctionCall,
    txFee,
    gasPrice,
    gas,
    nonce,
    relayerAddress,
    relayHubAddress,
}) => {
    const apiKey = await get('apiKey');
    const networkId = await get('networkId');
    // we need to check the quota
    const quotaResponse = window.fetch()

    const params = {
        from,
        to,
        encodedFunctionCall,
        txFee,
        gasPrice,
        gas,
        nonce,
        relayerAddress,
        relayHubAddress,
        apiKey,
        networkId,
    };


    const response = await ClientActionService.triggerClientAction({
        ...query,
        data: {
            type: actionRequestEvent,
            action: 'gsn.sign.transaction',
            params,
        },
    }, connection);

    return response.data.dataSignature;
};
