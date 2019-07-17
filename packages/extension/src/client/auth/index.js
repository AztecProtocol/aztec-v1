import mutate from '../utils/mutate';
import Web3Service from '../services/Web3Service';

const { keccak256 } = require('web3-utils');
const typedData = require('@aztec/typed-data');
const devUtils = require('@aztec/dev-utils');

const { EIP712_DOMAIN } = devUtils.constants.eip712;

const signatureSchema = {
    types: {
        RegisterExtensionSignature: [
            { name: 'account', type: 'address' },
        ],
        EIP712Domain: EIP712_DOMAIN,
    },
    primaryType: 'RegisterExtensionSignature',
};

const domain = [
    {
        name: 'name', type: 'string',
    },
    {
        name: 'version', type: 'string',
    },
    { name: 'chainId', type: 'uint256' },
    {
        name: 'verifyingContract', type: 'address',
    },
    { name: 'salt', type: 'bytes32' },
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
const domainData = {
    name: 'AZTECAccountRegistry',
    version: '2',
    chainId: 1563200229577,
    verifyingContract: '0x817214844A06973B1f0d3F7b78fCE79773b970aD',
    salt: '0xf2d857f4a3edcb9b78b4d503bfe733db1e3f6cdc2b7971ee739626c97e86a558',
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
        const { registerExtension: { publicKey } } = await mutate(` 
            registerExtension(password: "${password}", salt: "${salt}") {
                publicKey
            }
        `);

        const message = {
            account: Web3Service.account.address,
            linkedPublicKey: '0x01',
        };

        const data = JSON.stringify({
            types: {
                EIP712Domain: domain,
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


        // console.log(encodedTypedData, signature);

        // TODO longterm we need to process this on behalf of the user to abstract gas

        console.log(r, s, v);
        const receipt = Web3Service
            .useContract('AZTECAccountRegistry', Web3Service.deployed('AZTECAccountRegistry').address)
            .method('registerAZTECExtension')
            .send(Web3Service.account.address, '0x01', v, r, s);


        const events = await Web3Service
            .useContract('AZTECAccountRegistry', Web3Service.deployed('AZTECAccountRegistry').address)
            .events()
            .all();
        console.log(events);
    },
};
