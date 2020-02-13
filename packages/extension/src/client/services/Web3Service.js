import Web3Service from '~/utils/Web3Service';
import EventListeners from '~/utils/EventListeners';

class ClientWeb3Service extends Web3Service {
    constructor() {
        super();

        this.eventListeners = new EventListeners(['profile']);
        this.subscribeProfileListeners();
    }

    subscribeProfileListeners() {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                this.eventListeners.notify('profile', 'accountChanged', accounts[0]);
            });

            window.ethereum.on('chainChanged', (chainId) => {
                this.eventListeners.notify('profile', 'chainChanged', chainId);
            });

            // TODO - shall be removed in the future with autoRefreshOnNetworkChange
            window.ethereum.on('networkChanged', (networkId) => {
                this.eventListeners.notify('profile', 'networkChanged', networkId);
            });
        }
    }

    bindProfileChange(cb, allowMultiple = true) {
        if (!allowMultiple) {
            this.eventListeners.removeAll('profile');
        }
        this.eventListeners.add('profile', cb);
    }

    unbindProfileChange(cb) {
        this.eventListeners.remove('profile', cb);
    }
}

export default new ClientWeb3Service();
