import { get } from '~/utils/storage';
import ClientActionService from '~/background/services/ClientActionService';
import {
    actionRequestEvent,
} from '~/config/event';


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
    const apiKey = await get('apiKey') || 'test1234';
    const networkId = await get('networkId');

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

    return response.data.approvalData;
};
