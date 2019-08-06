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

const sendRegisterExtensionTx = async ({ linkedPublicKey, address }) => {
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
};

export default async function ensureExtensionInstalled() {
    const stream = from(account())
        .pipe(
            switchMap(({
                error,
                account,
                ...rest
            }) => {
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
