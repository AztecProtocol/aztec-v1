const apiKeyQuota = 'https://bv9t4hwozi.execute-api.us-east-1.amazonaws.com/Stage/{networkId}/{apiKey}';

const production = {
    origin: 'https://sdk.aztecprotocol.com',
    public: 'https://sdk.aztecprotocol.com/{version}/sdk/public',
    background: 'https://sdk.aztecprotocol.com/{version}/sdk/background.html',
    ui: 'https://sdk.aztecprotocol.com/{version}/sdk/ui.html',
    apiKeyQuota,
};

const development = {
    origin: 'http://localhost:5555',
    public: 'http://localhost:5555/sdk/public',
    background: 'http://localhost:5555/sdk/public/background.html',
    ui: 'http://localhost:5555/sdk/public/ui.html',
    apiKeyQuota,
};

const config = process.env.NODE_ENV === 'production'
    ? production
    : development;

export default config;
