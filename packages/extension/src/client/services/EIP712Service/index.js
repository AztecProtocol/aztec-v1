import Web3Service from '../Web3Service';
import registerExtension from './registerExtension';

export default async ({ data }) => {
    let eip712Data;
    const { address } = Web3Service.account;
    switch (data.response.action) {
        case 'metamask.register.extension': {
            eip712Data = registerExtension(data);
            break;
        }
    }

    const { result } = await Web3Service.sendAsync({
        method: 'eth_signTypedData_v3',
        params: [address, eip712Data],
        from: address,
    });
    return {
        ...data,
        signature: result,
    };
};
