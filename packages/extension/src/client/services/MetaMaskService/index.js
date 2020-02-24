import ethSigUtil from 'eth-sig-util';
import * as ethUtil from 'ethereumjs-util';
import Web3Service from '~/client/services/Web3Service';
import registerExtension, { generateTypedData } from './registerExtension';
import signNote from './signNote';
import permitSchema from './permitSchema';
import signProof from './signProof';

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
            const publicKey = ethUtil.ecrecover(hash, sigParams.v, sigParams.r, sigParams.s);


            response = {
                signature: result,
                publicKey,
            };

            break;
        }
        case 'metamask.eip712.signNotes': {
            const {
                assetAddress,
                noteHashes,
                challenge,
                sender,
            } = params;
            const signatures = (await Promise.all(noteHashes.map(async (noteHash) => {
                const noteSchema = signNote({
                    assetAddress,
                    noteHash,
                    challenge,
                    sender,
                });
                const method = 'eth_signTypedData_v4';
                return Web3Service.sendAsync({
                    method,
                    params: [address, noteSchema],
                    from: address,
                });
            }))).map(({ result }) => result);

            response = {
                signatures,
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

            response = {
                signature: result,
            };

            break;
        }
            case 'metamask.eip712.permit': {
                const {
                    allowed,
                    exipiry,
                    nonce,
                    spender,
                    verifyingContract,
                } = params;

                const permitSchema = permit({
                    allowed,
                    exipiry,
                    nonce,
                    spender,
                    verifyingContract
                });
                const method = 'eth_signTypedData_v4';
                const { result } = await Web3Service.sendAsync({
                    method,
                    params: [address, permitSchema],
                    from: address,
                });

                response = {
                    signature: result,
                };

                break;
            }
            default:
        }
        default:
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
