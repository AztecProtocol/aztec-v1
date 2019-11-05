import ethSigUtil from 'eth-sig-util';
import EthCrypto from 'eth-crypto';
import Web3Service from '~/client/services/Web3Service';
import registerExtension from './registerExtension';
import signNote from './signNote';

const handleAction = async (data) => {
    let response = {};
    const {
        action,
    } = data;
    const { address } = Web3Service.account;

    switch (action) {
        case 'metamask.register.extension': {
            const eip712Data = registerExtension(data);
            const method = 'eth_signTypedData_v3';
            const { result } = await Web3Service.sendAsync({
                method,
                params: [address, eip712Data],
                from: address,
            });

            const publicKey = ethSigUtil.extractPublicKey({
                data: eip712Data,
                sig: result,
            });
            const compressedPublicKey = EthCrypto.publicKey.compress(
                publicKey.slice(2),
            );

            response = {
                signature: result,
                publicKey: `0x${compressedPublicKey}`,
            };
            break;
        }
        case 'metamask.ace.publicApprove': {
            // we only need to do this if the proof sender is the user
            // TODO the wallet contract or any contract will be responsible for this
            const {
                response: {
                    assetAddress,
                    amount,
                    proofHash,
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
            const {
                response: {
                    assetAddress,
                    noteHashes,
                    challenge,
                    sender,
                },
            } = data;
            const signatures = (await Promise.all(noteHashes.map(async (noteHash) => {
                const noteSchema = signNote({
                    assetAddress,
                    noteHash,
                    challenge,
                    sender,
                });
                const method = 'eth_signTypedData_v3';
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
        case 'metamask.zkAsset.updateNoteMetadata': {
            const {
                response: {
                    noteHash,
                    assetAddress,
                    metadata,
                },
            } = data;
            await Web3Service
                .useContract('ZkAsset')
                .at(assetAddress)
                .method('updateNoteMetaData')
                .send(
                    noteHash,
                    metadata,
                );
            break;
        }
        case 'metamask.zkAsset.confidentialTransfer': {
            const {
                response: {
                    assetAddress,
                    proofData,
                    signatures,
                },
            } = data;
            await Web3Service
                .useContract('ZkAsset')
                .at(assetAddress)
                .method('confidentialTransfer')
                .send(
                    proofData,
                    signatures,
                );
            break;
        }
        default:
    }

    return response;
};

export default async function MetaMaskService({ data }) {
    try {
        const response = await handleAction(data);
        return {
            ...data,
            response: {
                ...response,
                success: true,
            },
        };
    } catch (error) {
        return {
            ...data,
            response: {
                success: false,
                error,
            },
        };
    }
}
