const Sequelize = require('sequelize');
const {
    getConfig,
} = require('../config');
const models = require('../models');


class DBFactory {
    constructor() {
        this.dbs = {};
    }

    ensureConnection(networkId) {
        if (this.dbs[networkId]) return;
        const {
            username,
            password,
            database,
            host,
            port,
            dialect,
        } = getConfig({
            networkId,
        });

        const connection = new Sequelize(
            database,
            username,
            password,
            {
                host,
                port,
                dialect,
            },
        );

        this.dbs[networkId] = models(connection);
    }

    getDB(networkId) {
        this.ensureConnection(networkId);
        return this.dbs[networkId];
    }

    // eslint-disable-next-line class-methods-use-this
    getDefaultConnection() {
        const {
            username,
            password,
            database,
            host,
            port,
            dialect,
        } = getConfig({
            database: 'postgres',
        });

        return new Sequelize(
            database,
            username,
            password,
            {
                host,
                port,
                dialect,
            },
        );
    }
}

module.exports = new DBFactory();
