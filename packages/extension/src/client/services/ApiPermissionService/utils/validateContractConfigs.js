import ApiError from '~/client/utils/ApiError';

const requiredContracts = [
    'ACE',
    'AccountRegistry',
];

export default function validateContractConfigs(contractsConfig, networkId) {
    const invalidContracts = requiredContracts.filter((contractName) => {
        const {
            address,
        } = contractsConfig.find(({ name }) => contractName === name) || {};
        return !address;
    });

    if (invalidContracts.length > 0) {
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
