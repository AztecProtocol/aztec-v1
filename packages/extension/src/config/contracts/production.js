import AZTECAccountRegistryGSNContract from '~contracts/AZTECAccountRegistryGSN.json';
import ACE from '~contracts/IAZTEC.json';
import IZkAsset from '~contracts/ZkAssetBase.json'; // TODO - use IZkAsset.json one it has updateNoteMetaData in it
import IERC20 from '~contracts/IERC20.json';

export default {
    AZTECAccountRegistry: {
        name: 'AZTECAccountRegistry',
        events: {
            registerExtension: 'RegisterExtension',
        },
        config: AZTECAccountRegistryGSNContract,
        networks: {
            4: '0xA1e862D85419a57D588CD4566e558f5987cFa67E',
        },
    },
    AZTECAccountRegistryGSN: {
        name: 'AZTECAccountRegistryGSN',
        events: {
            registerExtension: 'RegisterExtension',
        },
        config: AZTECAccountRegistryGSNContract,
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
