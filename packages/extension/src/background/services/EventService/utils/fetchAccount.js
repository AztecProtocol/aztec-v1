import {
    errorLog,
} from '~utils/log';
import Web3Service from '~background/services/Web3Service';
import {
    AZTECAccountRegistryConfig,
} from '~background/config/contracts'
 
export const fetchAccount = async({
    address,
} = {}) => {
    if (!address) {
        errorLog("'address' cannot be empty");
        return { error: null, account: null };
    };

    const eventName = AZTECAccountRegistryConfig.events.registerExtension

    const options = {
        filter: {
            account: address
        },
        fromBlock: 'earliest', 
        toBlock: 'latest',
    };

    try {
        const data = await Web3Service
            .useContract(AZTECAccountRegistryConfig.name)
            .events(eventName)
            .where(options);

        const accounts = data.map(({
            blockNumber,
            returnValues: {
                linkedPublicKey,
                registeredAt,
            }
        }) => ({
            address,
            blockNumber,
            linkedPublicKey,
            registeredAt,
        }));

        const account = accounts.length ? accounts[accounts.length - 1] : null;

        return { error: null, account: account };

    } catch (error) {
        return { error, account: null}
    };
}
