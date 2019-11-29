const express = require('express');
const bodyParser = require('body-parser');
const AdminBro = require('admin-bro')
const AdminBroSequelize = require('admin-bro-sequelizejs')
const AdminBroExpressjs = require('admin-bro-expressjs');

const {
    models,
} = require('./database');
const {
    Connection,
} = require('./database/helpers');
const {
    networks,
    getBroOptions,
    getNetworkConfig,
} = require('./helpers');

// db connections
const connection = new Connection();

// express server definition
const app = express();
app.use(bodyParser.json());


// Pass all configuration settings to AdminBro
const configureResourses = () => {
    const {
        ids,
    } = networks;
    ids.forEach(networkId => {
        const networkConf = getNetworkConfig(networkId);
        const sequelize = connection.getConnection(networkId);
        const db = models(sequelize);
        const options = getBroOptions(db, networkId);

        AdminBro.registerAdapter(AdminBroSequelize)
        const rootPath = `/${networkConf.networkName}`;
        const adminBro = new AdminBro({
            databases: [db],
            ...options,
            rootPath,
        });

        // Build and use a router which will handle all AdminBro routes
        const router = AdminBroExpressjs.buildRouter(adminBro);
        app.use(adminBro.options.rootPath, router);
    });
}

const initialize = () => {
    const {
        ids,
    } = networks;
    ids.forEach(networkId => connection.init({ networkId }));
};

const main = async () => {
    initialize();
    configureResourses();

    const {
        PORT,
    } = process.env;
    await app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`))
};

main();
