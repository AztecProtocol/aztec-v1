module.exports = {
    up: (queryInterface, DataTypes) => {
        const {
            STRING,
            INTEGER,
            DATE,
            BOOLEAN,
        } = DataTypes;

        return queryInterface.createTable('Dapps', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: INTEGER,
            },
            apiKey: {
                type: STRING,
                allowNull: false,
                unique: true,
            },
            isEnabled: {
                type: BOOLEAN,
                allowNull: false,
            },
            origin: {
                type: STRING,
                allowNull: false,
            },
            createdAt: {
                type: DATE,
                allowNull: false,
            },
            updatedAt: {
                type: DATE,
                allowNull: false,
            },
        });
    },
    down: (queryInterface, DataTypes) => {
        return queryInterface.dropTable('Daaps');
    },
};