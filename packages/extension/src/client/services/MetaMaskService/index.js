import ethSigUtil from 'eth-sig-util';
import { utils } from 'web3';
import Web3Service from '../Web3Service';
import registerExtension from './registerExtension';
import signNote from './signNote';

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
            const publicKey = ethSigUtil.extractPublicKey({
                data: eip712Data,
                sig: result,
            });

            return {
                ...data,
                response: {
                    signature: result,
                    publicKey: utils.keccak256(publicKey),
                },
            };
        }
        case 'metamask.ace.publicApprove': {
            // we only need to do this if the proof sender is the user
            // TODO the wallet contract or any contract will be responsible for this
            const {
                response: {
                    response: {
                        assetAddress,
                        amount,
                        proofHash,
                    },
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
            return {
                ...data,
                response: {
                    success: true,
                },
            };
        }
        case 'metamask.eip712.signNotes': {
            const {
                response: {
                    response: {
                        assetAddress,
                        noteHashes,
                        challenge,
                        sender,
                    },
                },
            } = data;
            const signatures = (await Promise.all(noteHashes.map(async (noteHash) => {
                const noteSchema = signNote({
                    assetAddress,
                    noteHash,
                    challenge,
                    sender,
                });
                method = 'eth_signTypedData_v3';
                return Web3Service.sendAsync({
                    method,
                    params: [address, noteSchema],
                    from: address,
                });
            }))).map(({ result }) => result);

            return {
                ...data,
                response: {
                    signatures,
                },
            };
        }

        case 'metamask.zkAsset.updateNoteMetadata': {
            const {
                response: {
                    response: {
                        noteHash,
                        assetAddress,
                        metadata,
                    },
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
            return {
                ...data,
                response: {
                    success: true,
                },
            };
        }
        default: {
            break;
        }
    }
};
