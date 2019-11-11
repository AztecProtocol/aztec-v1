import axios from 'axios';

const SIGNING_PROVIDER = 'https://bv9t4hwozi.execute-api.us-east-1.amazonaws.com';

export default async ({
        from, to, encodedFunctionCall, txFee, gasPrice, gas, nonce, relayerAddress, relayHubAddress,
}) => {
    let response;
    const data = {
        from, to, encodedFunctionCall, txFee, gasPrice, gas, nonce, relayerAddress, relayHubAddress,
    };

    console.log(`Lambda payload: ${JSON.stringify(data)}`);

    try {
        response = await axios.post(`${SIGNING_PROVIDER}/Stage/sign-data`, {
            data,
            apiKey: '1234567API_KEY',
        });

        console.log(`Lambda response: ${JSON.stringify(response)}`);
    } catch (error) {
        console.error(error);
    }
    
    return response.data.data.dataSignature;
};
