import AZTECAccountRegistryContract from '../../build/contracts/AZTECAccountRegistry.json';
import AZTECAccountRegistryGSNContract from '../../build/contracts/AZTECAccountRegistryGSN.json';
import ACE from '../../build/contracts/ACE.json';
import IZkAsset from '../../build/contracts/IZkAsset.json';


export const AZTECAccountRegistryConfig = {
    name: 'AZTECAccountRegistry',
    events: {
        registerExtension: 'RegisterExtension',
    },
    config: AZTECAccountRegistryContract,
    networks: {
        // 4: '0x91aFc8fA9278615843a08B26Ce97586c5057e717',
        4: '0xfa60fa7e5115a9f5ef118769c2743a4896715101',
    },
};

export const AZTECAccountRegistryGSNConfig = {
    name: 'AZTECAccountRegistryGSN',
    events: {
        registerExtension: 'RegisterExtension',
    },
    config: AZTECAccountRegistryGSNContract,
    networks: {
        4: '0xfa60fa7e5115a9f5ef118769c2743a4896715101',
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
