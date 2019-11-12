import axios from 'axios';

const SIGNING_PROVIDER = 'https://bv9t4hwozi.execute-api.us-east-1.amazonaws.com';

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

    const response = await axios.post(`${SIGNING_PROVIDER}/Stage/sign-data`, {
        data,
        apiKey: 'aztecprotocol_api_key',
    });

    console.log(`Lambda response: ${JSON.stringify(response)}`);
    return response.data.data.dataSignature;
};
