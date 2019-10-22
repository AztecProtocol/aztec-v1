import AZTECAccountRegistryContract from '../../build/contracts/AZTECAccountRegistry.json';
import ACE from '../../build/contracts/ACE.json';
import IZkAsset from '../../build/contracts/IZkAsset.json';


export const AZTECAccountRegistryConfig = {
    name: 'AZTECAccountRegistry',
    events: {
        registerExtension: 'RegisterExtension',
    },
    config: AZTECAccountRegistryContract,
    networks: {
        4: '0xa09a9a1C9aaF3F5591533a335aFcb310436828B5',
    },
};

export const ACEConfig = {
    name: 'ACE',
    events: {
        сreateNoteRegistry: 'CreateNoteRegistry',
    },
    config: ACE,
    networks: {
        4: '0xA3D1E4e451AB20EA33Dc0790b78fb666d66A650D',
    },
};

export const IZkAssetConfig = {
    name: 'IZkAsset',
    events: {
        createNote: 'CreateNote',
        updateNoteMetaData: 'UpdateNoteMetaData',
        destroyNote: 'DestroyNote',
    },
    config: IZkAsset,
    networks: {},
};
