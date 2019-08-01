import {
    of,
    from,
    Subject,
    forkJoin,
    timer,
    race,
    empty,
} from 'rxjs';
import {
    mergeMap,
    switchMap,
    take,
    map,
    filter,
} from 'rxjs/operators';

import mutate from '../utils/mutate';
import Web3Service from '../services/Web3Service';
import AZTECAccountRegistry from '../../../build/contracts/AZTECAccountRegistry';
import account from './account';


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

const sendRegisterExtensionTx = async ({ linkedPublicKey, address }) => {
    const accountRegistryContract = Web3Service.contract('AZTECAccountRegistry');
    const lastNetworkId = Object.keys(AZTECAccountRegistry.networks).pop();
    const network = AZTECAccountRegistry.networks[lastNetworkId];


    const domainData = {
        name: 'AZTECAccountRegistry',
        version: '2',
        chainId: lastNetworkId,
        verifyingContract: accountRegistryContract.address,
        salt: '0xf2d857f4a3edcb9b78b4d503bfe733db1e3f6cdc2b7971ee739626c97e86a558',
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

    const signature = result.substring(2);
    const r = `0x${signature.substring(0, 64)}`;
    const s = `0x${signature.substring(64, 128)}`;
    const v = parseInt(signature.substring(128, 130), 16);

    await Web3Service
        .useContract('AZTECAccountRegistry')
        .method('updateChainId')
        .send(lastNetworkId);

    await Web3Service
        .useContract('AZTECAccountRegistry')
        .method('registerAZTECExtension')
        .send(address, linkedPublicKey, v, r, s);

    return {
        account: {
            account: address,
            linkedPublicKey,
        },
    };
};

export default async function ensureExtensionInstalled() {
    const stream = from(account())
        .pipe(
            switchMap(({
                error,
                account,
                ...rest
            }) => {
                console.log(account, error);

                if (account && !account.registered) {
                    return from(sendRegisterExtensionTx(account));
                }
                if (account) {
                    return of({ account });
                }

                throw new Error(error);

                return empty();
            }),
            map(d => d),
        );

    return stream.toPromise();
}
