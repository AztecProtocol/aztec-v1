import {
    errorLog,
} from '~utils/log';
import Web3Service from '~background/services/Web3Service';
import {
    ACEConfig,
} from '~config/contracts'
 
export default async function fetchCreateNoteRegistries({
    //TODO: networkId feature is not implemented yet
    networkId,
    fromBlock,
    onError,
} = {}) {
    if (networkId === undefined) {
        errorLog("'networkId' cannot be empty");
        return [];
    }

    const event = {
        eventName: ACEConfig.сreateNoteRegistry,
    };

    const options = {
        fromBlock, 
        toBlock: 'latest'
    }

    try {
        const data = await Web3Service
            .useContract(ACEConfig.name)
            .events({event})
            .where(options);

        const events = data.map(({
            blockNumber,
            returnValues
        }) => ({
            blockNumber,
            ...returnValues,
        }));
        return events
    } catch (error) {
        //TODO: Check error handling
        throw error;
        onError(error);
    }
}
