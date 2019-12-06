const web3Factory = require('../../services/Web3Service/helpers/web3Factory');
const {
    AZTECAccountRegistryGSNConfig,
} = require('../../config/contracts');


module.exports = async ({
    signaturesHashes,
    networkId,
}) => {
    const options = {
        // TODO: must optimize this
        fromBlock: 0,
        toBlock: 'latest',
    };

    if (signaturesHashes) {
        options.filter = {
            signatureHash: signaturesHashes,
        };
    }

    const {
        name: AZTECAccountRegistryGSNContract,
        events: {
            GSNTransactionProcessed,
        },
        networks,
    } = AZTECAccountRegistryGSNConfig;

    const web3Service = web3Factory.getWeb3Service(networkId);
    const events = await web3Service
        .useContract(AZTECAccountRegistryGSNContract)
        .at(networks[networkId])
        .events(GSNTransactionProcessed)
        .where(options);

    return events.map(({
        blockNumber,
        transactionHash,
        returnValues: {
            signatureHash,
            success,
            actualCharge,
        },
    }) => ({
        blockNumber,
        signatureHash,
        transactionHash,
        success,
        actualCharge,
    }));
}