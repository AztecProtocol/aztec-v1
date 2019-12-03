import ApiError from '~client/utils/ApiError';
import Web3Service from '~/client/services/Web3Service';

const requiredContracts = [
    'ACE',
    'AZTECAccountRegistry',
];

export default function validateContractConfigs(contractsConfig) {
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
}
