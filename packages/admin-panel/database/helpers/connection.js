const Sequelize = require('sequelize');
const {
    getConfig,
} = require('../config');


class Connection {
    constructor() {
        this.connections = {}
    }

    init({
        networkId,
    }) {
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

        this.connections[networkId] = new Sequelize(
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

    getConnection(networkId) {
        if (!this.connections[networkId]) {
            throw new Error(`DB connection error for networkId: ${this.networkId}`);
        }
        return this.connections[networkId];
    }
}

module.exports = Connection;
