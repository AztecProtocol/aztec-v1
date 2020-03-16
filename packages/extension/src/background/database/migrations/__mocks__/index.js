const migrations = {};

export const clearMigrations = () => {
    Object.keys(migrations).forEach((key) => {
        delete migrations[key];
    });
};

export const mockMigrations = (newMigrations) => {
    clearMigrations();
    Object.keys(newMigrations).forEach((key) => {
        migrations[key] = newMigrations[key];
    });
};

export default migrations;
