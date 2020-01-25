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
        networks: {
            4: '0xA1e862D85419a57D588CD4566e558f5987cFa67E',
        },
    },
    AccountRegistryManager: {
        name: 'AccountRegistryManager',
        events: {
        },
        config: AccountRegistryManager,
        networks: {
            4: '0xA1e862D85419a57D588CD4566e558f5987cFa67E',
        },
    },
    ACE: {
        name: 'ACE',
        events: {
            сreateNoteRegistry: 'CreateNoteRegistry',
        },
        config: ACE,
        networks: {
            4: '0x66279F02E177867067895C6CF8bD6A02C03f2206',
        },
    },
    ZkAsset: {
        name: 'IZkAsset',
        events: {
            createNote: 'CreateNote',
            updateNoteMetaData: 'UpdateNoteMetaData',
            destroyNote: 'DestroyNote',
        },
        config: IZkAsset,
        networks: {},
    },
    ERC20: {
        name: 'ERC20',
        config: IERC20,
        networks: {},
    },
};
