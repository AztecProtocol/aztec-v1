import AssetsSyncManager from '.';


class AssetsSyncManagerFactory {
    managersByNetworks = {};

    ensureManager = (networkId) => {
        if (this.managersByNetworks[networkId]) {
            return;
        }
        this.managersByNetworks[networkId] = new AssetsSyncManager();
    };

    create(networkId) {
        this.ensureManager(networkId);
        return this.managersByNetworks[networkId];
    }
}

export default new AssetsSyncManagerFactory();
