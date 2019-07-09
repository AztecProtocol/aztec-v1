import mutate from '../utils/mutate';

export default {
    hasPermission: () => {},
    enable: ({
        graphQLServer,
    }) => mutate(`
        enableDomain(graphQLServer: "${graphQLServer}") {
            graphQLServer
        }
    `),
};
