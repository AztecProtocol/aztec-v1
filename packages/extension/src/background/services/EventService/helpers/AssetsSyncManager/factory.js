import AssetsSyncManager from '.';


class AssetsSyncManagerFactory {
    _managersByNetworks = {};

    _ensureManager = (networkId) => {
        if (this._managersByNetworks[networkId]) {
            return;
        }
        this._managersByNetworks[networkId] = new AssetsSyncManager();
    };

    create(networkId) {
        this._ensureManager(networkId);
        return this._managersByNetworks[networkId];
    }
}

export default new AssetsSyncManagerFactory();
