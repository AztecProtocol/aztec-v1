import '~utils/hot-reload';
import sync from './tasks/sync';
import acceptConnection from './tasks/acceptConnection';

const runScript = () => {
    acceptConnection();
    sync();
};

runScript();
