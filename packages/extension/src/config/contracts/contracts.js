export default {
    AccountRegistry: {
        name: 'Behaviour20200305',
        events: {
            registerExtension: 'RegisterExtension',
        },
        isProxyContract: true,
        managerContractName: 'AccountRegistryManager',
    },
    AccountRegistryManager: {
        name: 'AccountRegistryManager',
    },
    ACE: {
        name: 'ACE',
        events: {
            createNoteRegistry: 'CreateNoteRegistry',
        },
    },
    ZkAsset: {
        name: 'IZkAsset',
        events: {
            createNote: 'CreateNote',
            updateNoteMetaData: 'UpdateNoteMetaData',
            destroyNote: 'DestroyNote',
        },
    },
    ERC20: {
        name: 'ERC20',
    },
    IERC20Permit: {
        name: 'IERC20Permit',
    },
};
