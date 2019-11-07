// TODO - add another config file for production
const production = {
    background: 'http://sdk.aztecprotocol.com/public/background.html',
    ui: 'http://sdk.aztecprotocol.com/public/ui.html',
};
const development = {
    background: 'http://localhost:5555/sdk/public/background.html',
    ui: 'http://localhost:5555/sdk/public/ui.html',
    // background: 'http://sdk.aztecprotocol.com/public/background.html',
    // ui: 'http://sdk.aztecprotocol.com/public/ui.html',
};
const urls = {
    PRODUCTION: production,
    development,
};
const config = urls[process.env.NODE_ENV] || urls.development;
export default config;
