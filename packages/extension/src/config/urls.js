const apiKeyQuota = 'https://bv9t4hwozi.execute-api.us-east-1.amazonaws.com/Stage/{networkId}/{apiKey}';

const production = {
    origin: 'https://sdk.aztecprotocol.com',
    public: 'https://sdk.aztecprotocol.com/{version}/sdk/public',
    background: 'https://sdk.aztecprotocol.com/{version}/sdk/background.html',
    ui: 'https://sdk.aztecprotocol.com/{version}/sdk/ui.html',
    apiKeyQuota,
};

const staging = {
    origin: 'https://staging-sdk.aztecprotocol.com',
    public: 'https://staging-sdk.aztecprotocol.com/{version}/sdk/public',
    background: 'https://staging-sdk.aztecprotocol.com/{version}/sdk/background.html',
    ui: 'https://staging-sdk.aztecprotocol.com/{version}/sdk/ui.html',
    apiKeyQuota,
};

const development = {
    origin: 'https://localhost:5555',
    public: 'https://localhost:5555/sdk/public',
    background: 'https://localhost:5555/sdk/public/background.html',
    ui: 'https://localhost:5555/sdk/public/ui.html',
    apiKeyQuota,
};

function getConfig() {
    if (process.env.NODE_ENV === 'production') {
        return production;
    }

    if (process.env.NODE_ENV === 'integration' && process.env.SERVE_LOCATION) {
        return staging;
    }

    return development;
}

const config = getConfig();

export default config;
