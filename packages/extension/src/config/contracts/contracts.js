export default {
    AccountRegistry: {
        name: 'AccountRegistry',
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
            сreateNoteRegistry: 'CreateNoteRegistry',
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
};
