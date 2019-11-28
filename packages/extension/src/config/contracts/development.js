import AZTECAccountRegistryGSNContract from '~contracts/AZTECAccountRegistryGSN.json';
import ACE from '~contracts/ACE.json';
import IZkAsset from '~contracts/IZkAsset.json';
import IERC20 from '~contracts/ERC20Mintable.json';

export default {
    AZTECAccountRegistry: {
        name: 'AZTECAccountRegistry',
        events: {
            registerExtension: 'RegisterExtension',
        },
        config: AZTECAccountRegistryGSNContract,
        networks: {
            4: '0x1550b6bCb4cf0c72a0dCbBA2E8D901831C7FE0e3',
        },
    },
    AZTECAccountRegistryGSN: {
        name: 'AZTECAccountRegistryGSN',
        events: {
            registerExtension: 'RegisterExtension',
        },
        config: AZTECAccountRegistryGSNContract,
        networks: {
            4: '0x1550b6bCb4cf0c72a0dCbBA2E8D901831C7FE0e3',
        },
    },
    ACE: {
        name: 'ACE',
        events: {
            сreateNoteRegistry: 'CreateNoteRegistry',
        },
        config: ACE,
        networks: {
            4: '0x9c9dDe0cdB0CEa502Cc7Bc8Cd82fA06Ce478EBF6',
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
