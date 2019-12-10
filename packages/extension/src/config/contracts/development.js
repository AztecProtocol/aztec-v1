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
            // 4: '0x101a74Cc8544160037B4Ff43839f4EB24698b10B',
            4: '0xbB38820fC41C7CECa0B7352617269a946926F2CE',
            3: '0x4eb8f9e84e371d9A7Be5b8d6F32044eD9D9498c5',
        },
    },
    AZTECAccountRegistryGSN: {
        name: 'AZTECAccountRegistryGSN',
        events: {
            registerExtension: 'RegisterExtension',
        },
        config: AZTECAccountRegistryGSNContract,
        networks: {
            // 4: '0x101a74Cc8544160037B4Ff43839f4EB24698b10B',
            4: '0xbB38820fC41C7CECa0B7352617269a946926F2CE',
            3: '0x4eb8f9e84e371d9A7Be5b8d6F32044eD9D9498c5',
        },
    },
    ACE: {
        name: 'ACE',
        events: {
            сreateNoteRegistry: 'CreateNoteRegistry',
        },
        config: ACE,
        networks: {
            4: '0xFDd232eE75268D7Bc300ABFf960e45be78E1f245',
            3: '0x59Bb9FEF8dA35054886F0461248392F847010F3a',
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
