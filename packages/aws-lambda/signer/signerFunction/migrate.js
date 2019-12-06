const {
    OK_200,
    BAD_400,
} = require('./helpers/responses');
const {
    networks: {
        ids: networkIds,
    },
} = require('./helpers');
const {
    errorLog,
} = require('./utils/log');
const db = require('./database');


exports.migrationHandler = async (event) => {
    const {
        command = 'up',
    } = event;

    const {
        createDatabases,
        migrate,
        connect,
        close,
    } = db;

    /* eslint-disable no-await-in-loop */
    try {
        await createDatabases();

        for(let i = 0; i < networkIds.length; i += 1) {
            await connect();
            await migrate(command);
            await close();
        }
        return OK_200();
    } catch (e) {
        errorLog(e);
        return BAD_400({
            message: e.toString(),
        });
    }
};
