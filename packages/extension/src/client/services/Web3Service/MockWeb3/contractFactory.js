import Query from '~utils/Query';

const postToMockServer = async (type, queryStr, variables, methodName) => {
    const response = await Query({
        graphQLServerUrl: 'http://localhost:4000',
        query: `${type} ${queryStr}`,
        variables,
    });

    if (!response) {
        return response;
    }

    return response[methodName];
};

const queryTypeMapping = {
    address: 'String',
    bool: 'Boolean',
};

const toQueryType = (paramType) => {
    if (paramType.match(/int/)) {
        return 'Int';
    }
    if (paramType.match(/bytes|string/)) {
        return 'String';
    }
    return queryTypeMapping[paramType];
};

export default function contractFactory(abi, address) {
    const contract = {
        address,
        methods: {},
    };

    abi.forEach(({
        type,
        name,
        inputs,
    }) => {
        if (type === 'function') {
            const paramStr = inputs
                .map(({
                    name: paramName,
                    type: paramType,
                }) => `$${paramName}: ${toQueryType(paramType)}!`)
                .join(', ');
            const variableStr = inputs
                .map(({
                    name: paramName,
                }) => `${paramName}: $${paramName}`)
                .join(', ');
            const queryStr = !paramStr
                ? name
                : `(${paramStr}) { ${name}(${variableStr}) }`;
            contract.methods[name] = (...args) => {
                const variables = {};
                inputs.forEach(({
                    name: paramName,
                }, i) => {
                    variables[paramName] = args[i];
                });

                return {
                    call: () => postToMockServer('query', queryStr, variables, name),
                    send: () => postToMockServer('mutation', queryStr, variables, name),
                };
            };
        }
    });

    return contract;
}
