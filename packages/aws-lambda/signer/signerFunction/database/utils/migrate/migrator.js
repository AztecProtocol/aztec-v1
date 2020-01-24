const Umzug = require('umzug');
const path = require('path');

const migrationsPath = path.join(__dirname, '..', '..', 'migrations');

module.exports = (sequelize) => {
    const umzug = new Umzug({
        storage: 'sequelize',
        storageOptions: {
            sequelize,
        },

        // see: https://github.com/sequelize/umzug/issues/17
        migrations: {
            params: [
                sequelize.getQueryInterface(), // queryInterface
                sequelize.constructor, // DataTypes
                () => {
                    throw new Error(
                        'Migration tried to use old style "done" callback. Please upgrade to "umzug" and return a promise instead.',
                    );
                },
            ],
            path: migrationsPath,
            pattern: /\.js$/,
        },

        logging: () => {
            // console.log('migration logging')
            // console.log.apply(null, arguments);
        },
    });

    const logUmzugEvent = (eventName) => {
        return (name) => {
            console.log(`${name} ${eventName}`);
        };
    };

    umzug.on('migrating', logUmzugEvent('migrating'));
    umzug.on('migrated', logUmzugEvent('migrated'));
    umzug.on('reverting', logUmzugEvent('reverting'));
    umzug.on('reverted', logUmzugEvent('reverted'));

    return umzug;
};
