import initDb from './tasks/initDb';
import sync from './tasks/sync';
import acceptConnection from './tasks/acceptConnection';

const runScript = async () => {
    await initDb();
    acceptConnection();
    sync();
};

runScript();
