import ApiError from '~client/utils/ApiError';
import Web3Service from '~/client/services/Web3Service';
import ZkAsset from '~contracts/ZkAsset';
import ERC20Mintable from '~contracts/ERC20Mintable';

const clientContracts = [
    'ACE',
    'AZTECAccountRegistryGSN',
];

export default function setContractConfigs(contractsConfigs) {
    const {
        networkId,
    } = Web3Service;

    contractsConfigs
        .filter(({ config }) => clientContracts.indexOf(config.contractName) >= 0)
        .forEach(({
            config,
            address,
        }) => {
            console.log(address, config);
            if (!address) {
                throw new ApiError('input.contract.address.empty', {
                    messageOptions: {
                        contractName: config.contractName,
                    },
                    networkId,
                    contractName: config.contractName,
                });
            }
            Web3Service.registerContract(config, {
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
