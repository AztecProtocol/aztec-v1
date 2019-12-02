const express = require('express');
const bodyParser = require('body-parser');
const AdminBro = require('admin-bro')
const AdminBroSequelize = require('admin-bro-sequelizejs')
const AdminBroExpressjs = require('admin-bro-expressjs');
const bcrypt = require('bcrypt');
const Sequelize = require('sequelize');


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
app.use('/static', express.static('public'));


// Pass all configuration settings to AdminBro
const configureResourses = () => {
    const {
        ids,
    } = networks;
    ids.forEach(networkId => {
        const networkConfig = getNetworkConfig(networkId);
        const sequelize = connection.getConnection(networkId);
        const db = models(sequelize);
        const options = getBroOptions(db, networkConfig);
        const {
            Users,
        } = db;

        AdminBro.registerAdapter(AdminBroSequelize)
        const rootPath = `/${networkConfig.networkName}`;
        const loginPath = `${rootPath}/admin`;
        const logoutPath = `${rootPath}/admin`;
        const adminBro = new AdminBro({
            ...options,
            databases: [db],
            rootPath,
            loginPath,
            logoutPath,
        });

        // Build and use a router which will handle all AdminBro routes
        const router = AdminBroExpressjs.buildAuthenticatedRouter(adminBro, {
            authenticate: async (email, password) => {
                const user = await Users.findOne({ where: {
                    email: {
                        [Sequelize.Op.like]: email,
                    },
                    isEnabled: true,
                }});
                if (user) {
                    const matched = await bcrypt.compare(password, user.passwordHash);
                    if (matched) {
                        return user;
                    }
                }
                return false;
            },
            cookiePassword: process.env.COOKIES_PASSWORD,
        });
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
