/* global expect, beforeAll */
import dotenv from 'dotenv';
import sigUtil from 'eth-sig-util';
import secp256k1 from '@aztec/secp256k1';
/* eslint-disable import/no-unresolved */
import AZTECAccountRegistry from '../build/contracts/AZTECAccountRegistry';
/* eslint-enable */
import Web3Service from './helpers/Web3Service';
import Web3Events from './helpers/Web3Events';
import Query from './helpers/Query';

dotenv.config();

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
        type: 'bytes',
    },
];

describe('AZTECAccountRegistry', () => {
    let domainData;

    beforeAll(async () => {
        Web3Service.init();
        Web3Service.registerContract(AZTECAccountRegistry);

        const {
            networks,
        } = AZTECAccountRegistry;
        const networkIds = Object.keys(networks);
        const latestNetworkId = networkIds[networkIds.length - 1];
        const {
            address: verifyingContract,
        } = networks[latestNetworkId];

        domainData = {
            name: 'AZTECAccountRegistry',
            version: '2',
            chainId: latestNetworkId,
            verifyingContract,
            salt: '0xf2d857f4a3edcb9b78b4d503bfe733db1e3f6cdc2b7971ee739626c97e86a558',
        };

        await Web3Service
            .useContract('AZTECAccountRegistry')
            .method('updateChainId')
            .send(latestNetworkId);
    });

    it('trigger RegisterExtension event', async () => {
        const privateKey = process.env.GANACHE_TESTING_ACCOUNT_0;
        const sender = secp256k1.accountFromPrivateKey(process.env.GANACHE_TESTING_ACCOUNT_0);
        const address = sender.address.toLowerCase();
        const linkedPublicKey = '0x5b40992c57acce3ae5ed751b115f06d56eaa9c5265d1a5f950b991d604ec3815';
        const pkBuf= Buffer.from(privateKey.slice(2), 'hex');

        const result = sigUtil.signTypedData(pkBuf, {
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
        const signature = result.substring(2);
        const r = `0x${signature.substring(0, 64)}`;
        const s = `0x${signature.substring(64, 128)}`;
        const v = parseInt(signature.substring(128, 130), 16);

        await Web3Service
            .useContract('AZTECAccountRegistry')
            .method('registerAZTECExtension')
            .send(
                address,
                linkedPublicKey,
                v,
                r,
                s,
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
                address,
                linkedPublicKey,
            },
        });
    });
});
