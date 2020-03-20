import ethSigUtil from 'eth-sig-util';
import * as ethUtil from 'ethereumjs-util';
import { signer } from 'aztec.js';
import Web3Service from '~/client/services/Web3Service';
import registerExtension, { generateTypedData } from './registerExtension';
import permitSchema from './permitSchema';
import signProof from './signProof';

const getSignProofSignatureResponse = (address, signature) => {
    if (address === '0x7dd4e19395c47753370a7e20b3788546958b2ea6') {
        return {
            signature,
            signature2: signer.makeReplaySignature(signature),
        };
    }
    return {
        signature,
    };
};

const handleAction = async (action, params) => {
    let response = {};
    const { address } = Web3Service.account;

    switch (action) {
        case 'metamask.send': {
            const {
                contract,
                at,
                method,
                data,
            } = params;
            let contractObj = Web3Service.useContract(contract);
            if (at) {
                contractObj = contractObj.at(at);
            }
            response = await contractObj
                .method(method)
                .send(...data);
            break;
        }
        case 'metamask.register.extension': {
            const eip712Data = registerExtension(params);
            const method = 'eth_signTypedData_v4';

            const { result } = await Web3Service.sendAsync({
                method,
                params: [address, eip712Data],
                from: address,
            });

            const hash = ethSigUtil.TypedDataUtils.sign(generateTypedData(params));
            const signature = ethUtil.toBuffer(result);
            const sigParams = ethUtil.fromRpcSig(signature);
            let publicKey = ethUtil.ecrecover(hash, sigParams.v, sigParams.r, sigParams.s);
            publicKey = ethUtil.bufferToHex(publicKey);

            response = {
                signature: result,
                publicKey,
            };

            break;
        }
        case 'metamask.eip712.signProof': {
            const {
                assetAddress,
                proofHash,
                spender,
            } = params;

            const noteSchema = signProof({
                assetAddress,
                proofHash,
                approval: true,
                spender,
            });
            const method = 'eth_signTypedData_v4';
            const { result } = await Web3Service.sendAsync({
                method,
                params: [address, noteSchema],
                from: address,
            });

            response = getSignProofSignatureResponse(assetAddress, result);

            break;
        }
        case 'metamask.eip712.permit': {
            const {
                allowed,
                expiry,
                nonce,
                spender,
                verifyingContract,
            } = params;

            const permit = permitSchema({
                allowed,
                expiry,
                nonce,
                spender,
                holder: address,
                verifyingContract,
                chainId: Web3Service.networkId,
            });
            const method = 'eth_signTypedData_v4';
            const { result } = await Web3Service.sendAsync({
                method,
                params: [address, permit],
                from: address,
            });

            response = {
                signature: result,
            };

            break;
        }
        default:
            break;
    }

    return response;
};

export default async function MetaMaskService(action, params) {
    let response;
    let error;
    try {
        response = await handleAction(action, params);
        ({
            error,
        } = response || {});
    } catch (e) {
        error = e;
    }

    return {
        ...response,
        error,
        success: !error,
    };
}
