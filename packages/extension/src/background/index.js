import '~utils/hot-reload';
import init from './tasks/init';
import sync from './tasks/sync';
import acceptConnection from './tasks/acceptConnection';

const runScript = async () => {
    await init();
    acceptConnection();
    sync();
};

runScript();
