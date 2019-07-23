import mutate from '../utils/mutate';
import Web3Service from '../services/Web3Service';

// const devUtils = require('@aztec/dev-utils');

// const { EIP712_DOMAIN } = devUtils.constants.eip712;

// const signatureSchema = {
//     types: {
//         RegisterExtensionSignature: [
//             { name: 'account', type: 'address' },
//         ],
//         EIP712Domain: EIP712_DOMAIN,
//     },
//     primaryType: 'RegisterExtensionSignature',
// };

const domainParams = [
    {
        name: 'name',
        type: 'string',
    },
    {
        name: 'version',
        type: 'string',
    },
    {
        name: 'chainId',
        type: 'uint256',
    },
    {
        name: 'verifyingContract',
        type: 'address',
    },
    {
        name: 'salt',
        type: 'bytes32',
    },
];

const AZTECAccount = [
    {
        name: 'account',
        type: 'address',
    },
    {
        name: 'linkedPublicKey',
        type: 'string',
    },
];


export default {
    enableAsset: async ({
        asset,
    }) => mutate(`
        enableAssetForDomain(asset: "${asset}")
    `),
    login: ({
        password,
    }) => mutate(`
        login(password: "${password}")
    `),
    registerExtension: async ({ password, salt }) => {
        const response = await mutate(`
            registerExtension(password: "${password}", salt: "${salt}") {
                publicKey
            }
        `);
        const {
            registerExtension: { publicKey },
        } = response;
        const domainData = {
            name: 'AZTECAccountRegistry',
            version: '2',
            chainId: 1563200229577,
            verifyingContract: '0xb903FAb78F621D99218e8AD222080903E747671E',
            salt: '0xf2d857f4a3edcb9b78b4d503bfe733db1e3f6cdc2b7971ee739626c97e86a558',
        };

        const message = {
            account: Web3Service.account.address,
            linkedPublicKey: publicKey,
        };

        const data = JSON.stringify({
            types: {
                EIP712Domain: domainParams,
                AZTECAccount,
            },
            domain: domainData,
            primaryType: 'AZTECAccount',
            message,
        });


        const { result } = await Web3Service.sendAsync({
            method: 'eth_signTypedData_v3',
            params: [Web3Service.account.address, data],
            from: Web3Service.account.address,
        });

        const signature = result.substring(2);
        const r = `0x${signature.substring(0, 64)}`;
        const s = `0x${signature.substring(64, 128)}`;
        const v = parseInt(signature.substring(128, 130), 16);


        await Web3Service
            .useContract('AZTECAccountRegistry', Web3Service.deployed('AZTECAccountRegistry').address)
            .method('registerAZTECExtension')
            .send(Web3Service.account.address, publicKey, v, r, s);
    },
    registerAddress: async address => mutate(`
        registerAddress(address: "${address}")
    `),
};
