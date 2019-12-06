const {
    ids: networkIds,
} = require('../../helpers/networks');
const sequelize = require('./defaultConnection');

const dbPrefix = process.env.DB_DATABASE_PREFIX;


module.exports = async () => {
    const dbsNames = networkIds.map(networkId => `${dbPrefix}_${networkId}`);
    const query = 'SELECT datname FROM pg_database WHERE datistemplate = false and datname NOT IN(:dbsNames);';
    const dbsNotExisting = (await sequelize.query(query, {
        replacements: { dbsNames },
        type: sequelize.QueryTypes.SELEC,
    })).map(({datname}) => datname);
    const dbsToCreate = dbsNames.filter(name => dbsNotExisting.includes(name))

    const queryInterface = sequelize.getQueryInterface();

    return sequelize.transaction((transaction) => {
        return Promise.all(
            dbsToCreate.map(dbName => queryInterface.createDatabase(dbName, null, { transaction }))
        );
    });
};
