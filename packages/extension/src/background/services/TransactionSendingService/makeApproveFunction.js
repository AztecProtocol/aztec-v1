import ClientActionService from '~/background/services/ClientActionService';
import {
    actionRequestEvent,
} from '~/config/event';

export default function makeApproveFunction(query, connection) {
    return async ({
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
        };

        const response = await ClientActionService.triggerClientAction({
            ...query,
            data: {
                type: actionRequestEvent,
                action: 'apiKeyApproval',
                params,
            },
        }, connection);

        return response.data.approvalData;
    };
}
