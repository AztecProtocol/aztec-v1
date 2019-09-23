import AZTECAccountRegistryContract from '~background/contracts/AZTECAccountRegistry';
import ACE from '~background/contracts/ACE';
import IZkAsset from '~background/contracts/IZkAsset';


export const AZTECAccountRegistryConfig = {
    name: 'AZTECAccountRegistry',
    events: {
        registerExtension: 'RegisterExtension',
    },
    config: AZTECAccountRegistryContract,
};

export const ACEConfig = {
    name: 'ACE',
    events: {
        сreateNoteRegistry: 'CreateNoteRegistry',
    },
    config: ACE,
};

export const IZkAssetConfig = {
    name: 'IZkAsset',
    events: {
        createNote: 'CreateNote',
        updateNoteMetaData: 'UpdateNoteMetaData',
        destroyNote: 'DestroyNote',
    },
    config: IZkAsset,
};
