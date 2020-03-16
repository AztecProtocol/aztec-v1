import {
    warnLog,
} from '~/utils/log';
import {
    defaultMaxAssets,
    defaultMaxNotes,
    defaultMaxRawNotes,
    defaultMaxCallbacks,
    defaultMaxProcesses,
    defaultNotesPerBatch,
} from '../config';
import AssetManager from './AssetManager';

export default class ApiSessionManager {
    constructor(noteServiceVersion) {
        this.version = noteServiceVersion;
        this.networkId = null;
        this.owner = {
            address: '',
            linkedPublicKey: '',
            linkedPrivateKey: '',
        };
        this.assetManager = null;
    }

    reset(
        networkId,
        owner,
    ) {
        this.networkId = networkId;
        this.owner = owner;
        this.assetManager = new AssetManager({
            version: this.version,
            networkId,
            owner,
            maxAssets: defaultMaxAssets,
            maxNotes: defaultMaxNotes,
            maxRawNotes: defaultMaxRawNotes,
            maxCallbacks: defaultMaxCallbacks,
            maxProcesses: defaultMaxProcesses,
            notesPerBatch: defaultNotesPerBatch,
        });
    }

    isSameSession(networkId, ownerAddress, logWarning = false) {
        const isSame = ownerAddress === this.owner.address
            && networkId === this.networkId;

        if (!isSame && logWarning) {
            warnLog(`Owner address does not match the current address. ${ownerAddress} !== ${this.owner.address}`);
        }

        return isSame;
    }

    async init(networkId, owner) {
        const {
            address: ownerAddress,
        } = owner;
        if (this.isSameSession(networkId, ownerAddress)) return;

        if (this.assetManager) {
            this.assetManager.clear();
        }

        this.reset(networkId, owner);

        await this.assetManager.init();
    }

    async save() {
        await this.assetManager.saveAll();
    }

    async ensureSynced(networkId, ownerAddress, assetId, cb) {
        if (!this.isSameSession(networkId, ownerAddress, true)) {
            return null;
        }

        return this.assetManager.ensureSynced(
            assetId,
            cb,
        );
    }

    addRawNotes({
        networkId,
        ownerAddress,
        notes,
    }) {
        if (!this.isSameSession(networkId, ownerAddress)) return;

        this.assetManager.addRawNotes(notes);
    }
}
