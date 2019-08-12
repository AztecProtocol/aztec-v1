import Web3Service from '../services/Web3Service';

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
        name: 'verifyingContract',
        type: 'address',
    },
];

const AZTECAccount = [
    {
        name: 'account',
        type: 'address',
    },
    {
        name: 'linkedPublicKey',
        type: 'bytes',
    },
];

export default async function sendRegisterExtensionTx({
    address,
    linkedPublicKey,
}) {
    const accountRegistryContract = Web3Service.contract('AZTECAccountRegistry');

    const domainData = {
        name: 'AZTECAccountRegistry',
        version: '2',
        verifyingContract: accountRegistryContract.address,
    };

    const message = {
        account: address,
        linkedPublicKey,
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
        params: [address, data],
        from: address,
    });

    await Web3Service
        .useContract('AZTECAccountRegistry')
        .method('registerAZTECExtension')
        .send(address, linkedPublicKey, result);

    return {
        account: {
            account: address,
            linkedPublicKey,
        },
    };
}
