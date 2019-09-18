import Web3Service from '../Web3Service';
import registerExtension from './registerExtension';

export default async ({ data }) => {
    let eip712Data;
    let method;
    const {
        response: {
            action,
        },
    } = data;
    const { address } = Web3Service.account;
    switch (action) {
        case 'metamask.register.extension': {
            eip712Data = registerExtension(data);
            method = 'eth_signTypedData_v3';
            const { result } = await Web3Service.sendAsync({
                method,
                params: [address, eip712Data],
                from: address,
            });
            return {
                ...data,
                signature: result,
            };
            break;
        }
        case 'metamask.ace.publicApprove': {
            // we only need to do this if the proof sender is the user
            const {
                response: {
                    assetAddress,
                    proofHash,
                    amount,
                },
            } = data;
            await Web3Service
                .useContract('ACE')
                .method('publicApprove')
                .send(
                    assetAddress,
                    proofHash,
                    amount,
                );
            break;
        }
        case 'metamask.eip712.signNotes': {

            // we have a choice do this as a loop, use the wallet contract, or ammend confidential approve

            eip712Data = signNote(data);
            method = 'eth_signTypedData_v3';
            const { result } = await Web3Service.sendAsync({
                method,
                params: [address, eip712Data],
                from: address,
            });
            return {
                ...data,
                signature: result,
            };
        }
        default: {
            break;
        }
    }
};
