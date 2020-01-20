const Sequelize = require('sequelize');
const { getConfig } = require('../config');

class Connection {
    constructor() {
        this.networkId = null;
        this.sequelize = null;
    }

    init({ networkId }) {
        const { username, password, database, host, port, dialect } = getConfig({
            networkId,
        });

        this.sequelize = new Sequelize(database, username, password, {
            host,
            port,
            dialect,
        });
    }

    getConnection() {
        if (!this.sequelize) {
            throw new Error(`DB connection error for networkId: ${this.networkId}`);
        }
        return this.sequelize;
    }

    // eslint-disable-next-line class-methods-use-this
    getDefaultConnection() {
        const { username, password, database, host, port, dialect } = getConfig({
            database: 'postgres',
        });

        return new Sequelize(database, username, password, {
            host,
            port,
            dialect,
        });
    }
}

module.exports = new Connection();
