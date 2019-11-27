import ApiError from '~client/utils/ApiError';
import Web3Service from '~/client/services/Web3Service';

const requiredContracts = [
    'ACE',
    'AZTECAccountRegistry',
];

export default function setContractConfigs(contractsConfig) {
    const invalidContracts = requiredContracts.filter((contractName) => {
        const {
            address,
        } = contractsConfig.find(({ name }) => contractName === name) || {};
        return !address;
    });

    if (invalidContracts.length > 0) {
        const {
            networkId,
        } = Web3Service;

        throw new ApiError('input.contract.address.empty', {
            messageOptions: {
                count: invalidContracts.length,
                contractName: invalidContracts
                    .map(name => `"${name}"`)
                    .join(', '),
            },
            networkId,
            invalidContracts,
        });
    }

    contractsConfig.forEach(({
        name,
        config,
        address,
    }) => {
        if (!address) {
            Web3Service.registerInterface(config, {
                name,
            });
        } else {
            Web3Service.registerContract(config, {
                name,
                address,
            });
        }
    });
}
