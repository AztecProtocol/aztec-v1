import axios from 'axios';

const SIGNING_PROVIDER = 'https://bv9t4hwozi.execute-api.us-east-1.amazonaws.com';

export default (apiKey) => {
    return async ({
        from, to, encodedFunctionCall, txFee, gasPrice, gas, nonce, relayerAddress, relayHubAddress,
    }) => {
        let response;
        const data = {
            from, to, encodedFunctionCall, txFee, gasPrice, gas, nonce, relayerAddress, relayHubAddress,
        };
    
        try {
            response = await axios.post(`${SIGNING_PROVIDER}/Stage/sign-data`, {
                data,
                apiKey,
            });
        } catch (error) {
            console.error(error);
        }
        
        return response.data.data.dataSignature;
    };
}
