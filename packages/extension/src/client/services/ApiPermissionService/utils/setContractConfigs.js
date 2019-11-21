import ApiError from '~client/utils/ApiError';
import Web3Service from '~/client/services/Web3Service';
import ZkAsset from '~contracts/ZkAsset';
import ERC20Mintable from '~contracts/ERC20Mintable';

const clientContracts = [
    'ACE',
    'AZTECAccountRegistry',
];

export default function setContractConfigs(contractsConfig) {
    const {
        networkId,
    } = Web3Service;

    clientContracts.forEach((contractName) => {
        const {
            config,
            address,
        } = contractsConfig.find(({ name }) => contractName === name) || {};

        if (!address) {
            throw new ApiError('input.contract.address.empty', {
                messageOptions: {
                    contractName,
                },
                networkId,
                contractName,
            });
        }

        Web3Service.registerContract(config, {
            name: contractName,
            address,
        });
    });

    Web3Service.registerInterface(ERC20Mintable, {
        name: 'ERC20',
    });

    Web3Service.registerInterface(ZkAsset, {
        name: 'ZkAsset',
    });
}
