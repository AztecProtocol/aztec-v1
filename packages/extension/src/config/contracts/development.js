import AZTECAccountRegistryGSNContract from '~contracts/AZTECAccountRegistryGSN.json';
import ACE from '~contracts/ACE.json';
import IZkAsset from '~contracts/ZkAssetBase.json'; // TODO - use IZkAsset.json one it has updateNoteMetaData in it
import IERC20 from '~contracts/ERC20Mintable.json';

export default {
    AZTECAccountRegistry: {
        name: 'AZTECAccountRegistry',
        events: {
            registerExtension: 'RegisterExtension',
        },
        config: AZTECAccountRegistryGSNContract,
        networks: {
            4: '0xC13dE0b75fF8C1DBa6CeB65f9bC28cB43AA6c2a1',
        },
    },
    AZTECAccountRegistryGSN: {
        name: 'AZTECAccountRegistryGSN',
        events: {
            registerExtension: 'RegisterExtension',
        },
        config: AZTECAccountRegistryGSNContract,
        networks: {
            4: '0xC13dE0b75fF8C1DBa6CeB65f9bC28cB43AA6c2a1',
        },
    },
    ACE: {
        name: 'ACE',
        events: {
            сreateNoteRegistry: 'CreateNoteRegistry',
        },
        config: ACE,
        networks: {
            4: '0x9be0e65c568FDDA547AD9879e565d3d48C43408E',
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
