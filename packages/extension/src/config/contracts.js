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
        4: '0x47c4441013b58848a0732cbb6cea2c09e08e0758',
    },
};

export const AZTECAccountRegistryGSNConfig = {
    name: 'AZTECAccountRegistryGSN',
    events: {
        registerExtension: 'RegisterExtension',
    },
    config: AZTECAccountRegistryGSNContract,
    networks: {
        4: '0x47c4441013b58848a0732cbb6cea2c09e08e0758',
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

export default {
    ZkAsset: IZkAssetConfig,
    ACE: ACEConfig,
    AZTECAccountRegistryGSN: AZTECAccountRegistryGSNConfig,
    AZTECAccountRegistry: AZTECAccountRegistryGSNConfig,
};
