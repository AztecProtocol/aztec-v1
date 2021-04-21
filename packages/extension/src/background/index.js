import acceptConnection from './tasks/acceptConnection';

const CURRENT_VERSION = 1;

const runScript = async () => {
    const version = parseInt(localStorage.getItem('CURRENT_VERSION') || 0, 10);
    if (version < CURRENT_VERSION) {
        localStorage.clear();
        localStorage.setItem('CURRENT_VERSION', CURRENT_VERSION);
    }
    acceptConnection();
};

runScript();
