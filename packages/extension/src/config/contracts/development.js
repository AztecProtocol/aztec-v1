import AZTECAccountRegistryContract from '~contracts/AZTECAccountRegistry.json';
import ACE from '~contracts/ACE.json';
import IZkAsset from '~contracts/IZkAsset.json';

export default {
    AZTECAccountRegistry: {
        name: 'AZTECAccountRegistry',
        events: {
            registerExtension: 'RegisterExtension',
        },
        config: AZTECAccountRegistryContract,
        networks: {
            4: '0x91aFc8fA9278615843a08B26Ce97586c5057e717',
        },
    },
    ACE: {
        name: 'ACE',
        events: {
            сreateNoteRegistry: 'CreateNoteRegistry',
        },
        config: ACE,
        networks: {
            4: '0xA3D1E4e451AB20EA33Dc0790b78fb666d66A650D',
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
};
