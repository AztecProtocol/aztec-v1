import AccountRegistry from '~contracts/Behaviour20200106.json';
import AccountRegistryManager from '~contracts/AccountRegistryManager.json';
import ACE from '~contracts/IAZTEC.json';
import IERC20 from '~contracts/IERC20Mintable.json';
import IZkAsset from '~contracts/IZkAsset.json';

export default {
    AccountRegistry: {
        name: 'AccountRegistry',
        events: {
            registerExtension: 'RegisterExtension',
        },
        config: AccountRegistry,
        isProxyContract: true,
        managerContractName: 'AccountRegistryManager',
    },
    AccountRegistryManager: {
        name: 'AccountRegistryManager',
        config: AccountRegistryManager,
    },
    ACE: {
        name: 'ACE',
        events: {
            сreateNoteRegistry: 'CreateNoteRegistry',
        },
        config: ACE,
    },
    ZkAsset: {
        name: 'IZkAsset',
        events: {
            createNote: 'CreateNote',
            updateNoteMetaData: 'UpdateNoteMetaData',
            destroyNote: 'DestroyNote',
        },
        config: IZkAsset,
    },
    ERC20: {
        name: 'ERC20',
        config: IERC20,
    },
};
