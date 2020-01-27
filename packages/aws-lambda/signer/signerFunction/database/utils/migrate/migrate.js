const getCommand = require('./getCommand');
const migrator = require('./migrator');
const { connection } = require('../../helpers');

module.exports = async (commandStr) => {
    const conn = connection.getConnection();
    const umzug = migrator(conn);
    const command = getCommand(commandStr);

    if (!command) {
        console.log(`invalid cmd: ${commandStr}`);
        return;
    }
    try {
        const executedMigrations = await umzug.executed();
        console.log(`already executedMigrations:`, executedMigrations);

        const pendingMigrations = await umzug.pending();
        console.log(`pendingMigrations:`, pendingMigrations);

        console.log(`${commandStr.toUpperCase()} BEGIN`);

        await command(umzug);
    } catch (e) {
        console.error(`Errror during migration: `, e);
    }
};
