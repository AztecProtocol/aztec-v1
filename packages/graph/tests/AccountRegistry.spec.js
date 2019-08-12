import sigUtil from 'eth-sig-util';
import secp256k1 from '@aztec/secp256k1';
/* eslint-disable import/no-unresolved */
import AZTECAccountRegistry from '../build/contracts/AZTECAccountRegistry';
/* eslint-enable */
import Web3Service from './helpers/Web3Service';
import Web3Events from './helpers/Web3Events';
import Query from './helpers/Query';

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

describe('AZTECAccountRegistry', () => {
    let domainData;

    beforeAll(async () => {
        Web3Service.init();
        Web3Service.registerContract(AZTECAccountRegistry);

        domainData = {
            name: 'AZTECAccountRegistry',
            version: '2',
            verifyingContract: Web3Service.contract('AZTECAccountRegistry').address,
        };
    });

    it('trigger RegisterExtension event', async () => {
        const {
            address,
            privateKey,
        } = secp256k1.generateAccount();
        const linkedPublicKey = '0x5b40992c57acce3ae5ed751b115f06d56eaa9c5265d1a5f950b991d604ec3815';
        const pkBuf = Buffer.from(privateKey.slice(2), 'hex');

        const signature = sigUtil.signTypedData(pkBuf, {
            data: {
                primaryType: 'AZTECAccount',
                types: {
                    EIP712Domain: domainParams,
                    AZTECAccount,
                },
                domain: domainData,
                message: {
                    account: address,
                    linkedPublicKey,
                },
            },
        });

        await Web3Service
            .useContract('AZTECAccountRegistry')
            .method('registerAZTECExtension')
            .send(
                address,
                linkedPublicKey,
                signature,
            );

        const pastEvents = await Web3Service
            .useContract('AZTECAccountRegistry')
            .events('RegisterExtension')
            .where({
                id: address,
            });

        Web3Events(pastEvents)
            .event('RegisterExtension')
            .toHaveBeenCalledTimes(1)
            .toHaveBeenCalledWith({
                account: address,
                linkedPublicKey,
            });

        const query = `
            account(id:"${address.toLowerCase()}") {
                address
                linkedPublicKey
            }
        `;
        const registeredAccount = await Query({
            query,
        });

        expect(registeredAccount).toEqual({
            account: {
                address: address.toLowerCase(),
                linkedPublicKey,
            },
        });
    });
});
