module.exports = {
    getConfig: ({ networkId, database }) => ({
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: database || `${process.env.DB_DATABASE_PREFIX}_${networkId}`,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
    }),
};
