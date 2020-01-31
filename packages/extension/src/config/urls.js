const production = {
    public: 'http://sdk.aztecprotocol.com/public',
    background: 'http://sdk.aztecprotocol.com/public/background.html',
    ui: 'http://sdk.aztecprotocol.com/public/ui.html',
};

const development = {
    public: 'http://localhost:5555/sdk/public',
    background: 'http://localhost:5555/sdk/public/background.html',
    ui: 'http://localhost:5555/sdk/public/ui.html',
};

const config = process.env.NODE_ENV === 'production'
    ? production
    : development;

export default config;
