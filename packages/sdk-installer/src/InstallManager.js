export default class InstallerManager {
    constructor(version) {
        this.version = version;
        this.scriptId = 'aztec-sdk-script';
        this.onLoadListeners = new Set();

        this.init();
    }

    init() {
        if (window.aztec) return;

        if (window.aztecCallback) {
            this.onLoadListeners.add(window.aztecCallback);
        }
        window.aztecCallback = this.handleAztecLoaded;

        const readyStates = [
            'complete',
            'interactive',
        ];

        if (readyStates.indexOf(document.readyState) >= 0) {
            this.addSdkScript();
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                this.addSdkScript();
            });
        }
    }

    addSdkScript() {
        const prevScript = document.getElementById(this.scriptId);
        if (prevScript) return;

        const script = document.createElement('script');
        script.id = this.scriptId;
        script.type = 'module';
        script.src = `https://sdk.aztecprotocol.com/${this.version}/sdk/aztec.js`;
        document.body.appendChild(script);
    }

    handleAztecLoaded = () => {
        if (!this.onLoadListeners) return;

        this.onLoadListeners.forEach((cb) => {
            cb();
        });
        this.onLoadListeners = null;
    };

    onLoad(cb) {
        if (window.aztec) {
            cb();
        } else {
            this.onLoadListeners.add(cb);
        }
    }
}
