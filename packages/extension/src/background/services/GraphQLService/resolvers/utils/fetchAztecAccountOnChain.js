import Web3Service from '~helpers/NetworkService';
import {
    AZTECAccountRegistry,
} from '~config/contractEvents';

export default async function fetchAztecAccountOnChain({
    address,
    networkId,
}) {
    const web3Service = await Web3Service({ networkId });

    const options = {
        filter: {
            account: address,
        },
        fromBlock: 'earliest',
        toBlock: 'latest',
    };

    let account;
    let error;
    try {
        const data = await web3Service
            .useContract('AZTECAccountRegistry')
            .events(AZTECAccountRegistry.registerExtension)
            .where(options);

        const accounts = data.map(({
            blockNumber,
            returnValues: {
                linkedPublicKey,
                spendingPublicKey,
            },
        }) => ({
            address,
            blockNumber,
            linkedPublicKey,
            spendingPublicKey,
        }));

        [account] = accounts || [];
    } catch (e) {
        error = e;
    }

    return {
        error,
        account,
    };
}
