import '~utils/hot-reload';
import init from './tasks/init';
import acceptConnection from './tasks/acceptConnection';

const runScript = async () => {
    await init();
    acceptConnection();
};

runScript();
