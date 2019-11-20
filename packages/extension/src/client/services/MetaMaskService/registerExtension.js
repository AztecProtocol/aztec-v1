import Web3Service from '~/client/services/Web3Service';

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

export default ({ response }) => {
    const accountRegistryContract = Web3Service.contract('AZTECAccountRegistryGSN');

    const domainData = {
        name: 'AZTECAccountRegistry',
        version: '2',
        verifyingContract: accountRegistryContract.address,
    };

    const message = {
        account: response.address,
        linkedPublicKey: response.linkedPublicKey,
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

    return data;
};
