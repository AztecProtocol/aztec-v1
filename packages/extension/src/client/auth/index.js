import mutate from '../utils/mutate';
import Web3Service from '../services/Web3Service';

const typedData = require('@aztec/typed-data');
const devUtils = require('@aztec/dev-utils');

const { EIP712_DOMAIN } = devUtils.constants.eip712;

const signatureSchema = {
    types: {
        RegisterExtensionSignature: [
            { name: 'account', type: 'address' },
            { name: 'linkedPublicKey', type: 'bytes32' },
        ],
        EIP712Domain: EIP712_DOMAIN,
    },
    primaryType: 'RegisterExtensionSignature',
};

export default {
    enableAsset: async ({ domain, asset }) => await mutate(`
            enableAssetForDomain(domain: "${domain}", asset: "${asset}") 
        `),
    login: ({
        password,
    }) => mutate(`
        login(password: "${password}") 
    `),
    registerExtension: async ({ password, salt }) => {
        console.log(password, salt);
        const { registerExtension: { publicKey } } = await mutate(` 
            registerExtension(password: "${password}", salt: "${salt}") {
                publicKey
            }
        `);

        const message = {
            account: Web3Service.account,
            linkedPublicKey: publicKey,
        };

        const encodedTypedData = typedData.encodeTypedData({
            domain: EIP712_DOMAIN,
            ...signatureSchema,
            message,
        });
        console.log(encodedTypedData);

        const signature = await Web3Service.web3.currentProvider.sendAsync({
            method: 'eth_signTypedData_v4',
            params: [Web3Service.account, encodedTypedData],
            from: Web3Service.account,
        });
        console.log(encodedTypedData, signature);

        // TODO longterm we need to process this on behalf of the user to abstract gas

        const receipt = await Web3Service
            .useContract('AZTECAccountRegistry')
            .method('registerExtension')
            .send(Web3Service.account, publicKey, signature);
    },
};
