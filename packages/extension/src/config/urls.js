const production = {
    origin: 'http://sdk.aztecprotocol.com',
    public: 'http://sdk.aztecprotocol.com/{version}/sdk/public',
    background: 'http://sdk.aztecprotocol.com/{version}/sdk/public/background.html',
    ui: 'http://sdk.aztecprotocol.com/{version}/sdk/public/ui.html',
};

const development = {
    origin: 'http://localhost:5555',
    public: 'http://localhost:5555/sdk/public',
    background: 'http://localhost:5555/sdk/public/background.html',
    ui: 'http://localhost:5555/sdk/public/ui.html',
};

const config = process.env.NODE_ENV === 'production'
    ? production
    : development;

export default config;
