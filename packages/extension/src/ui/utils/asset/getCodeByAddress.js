import tokensConfig from '~ui/config/tokens';

export default function getCodeByAddress(address, network) {
    const code = Object.keys(tokensConfig)
        .find((key) => {
            const {
                networks: {
                    [network]: networkConfig,
                },
            } = tokensConfig[key];
            return (networkConfig && networkConfig.address) === address;
        });

    return code || '';
}
