/* eslint-disable class-methods-use-this */
import json from '../package.json';
import InstallManager from './InstallManager';

let manager = null;

class AztecSdkInstaller {
    constructor() {
        if (typeof window === 'undefined') {
            console.error('AZTEC SDK can only be run in web browser.'); // eslint-disable-line no-console
            return;
        }

        this.version = json.version;
        this.aztec = null;

        manager = new InstallManager(this.version);

        manager.onLoad(() => {
            this.aztec = window.aztec;
        });

        if (process.env.NODE_ENV === 'test') {
            this.manager = manager;
        }
    }

    onLoad(cb) {
        manager.onLoad(cb);
    }
}

const SdkInstaller = process.env.NODE_ENV === 'test' ? AztecSdkInstaller : null;

export { SdkInstaller };

export default new AztecSdkInstaller();
