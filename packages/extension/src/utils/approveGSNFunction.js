import axios from 'axios';
import {
    SIGNING_PROVIDER,
} from '~config/constants';


export default async ({
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
    const data = {
        from, to, encodedFunctionCall, txFee, gasPrice, gas, nonce, relayerAddress, relayHubAddress,
    };
    console.warn('TODO: approveGSNFunction handle dev / prod url');

    const response = await axios.post(`${SIGNING_PROVIDER}/Stage/sign-data`, {
        data,
        apiKey: 'aztecprotocol_api_key',
    });

    console.log(`Lambda response: ${JSON.stringify(response)}`);
    return response.data.data.dataSignature;
};
