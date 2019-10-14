import Web3Service from '~helpers/NetworkService';
import {
    AZTECAccountRegistryConfig,
} from '~config/contracts';

export default async function fetchAccount({
    address,
    networkId,
} = {}) {
    if (!address) {
        return {
            error: new Error("'address' cannot be empty in fetchAccount"),
            account: null,
        };
    }
    if (!networkId) {
        return {
            error: new Error("'networkId' cannot be empty in fetchAccount"),
            account: null,
        };
    }

    const web3Service = await Web3Service({ networkId });

    const eventName = AZTECAccountRegistryConfig.events.registerExtension;

    const options = {
        filter: {
            account: address,
        },
        fromBlock: 'earliest',
        toBlock: 'latest',
    };

    try {
        const data = await web3Service
            .useContract(AZTECAccountRegistryConfig.name)
            .events(eventName)
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

        const account = accounts.length ? accounts[accounts.length - 1] : null;

        return {
            error: null,
            account,
        };
    } catch (error) {
        return {
            error,
            account: null,
        };
    }
}
