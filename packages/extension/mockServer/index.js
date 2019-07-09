import {
    ApolloServer,
} from 'apollo-server';
import {
    typeDefs,
    resolvers,
} from './schema';

const mockServerPort = 4000;

const server = new ApolloServer({
    typeDefs,
    resolvers,
});

server.listen({
    port: mockServerPort,
}).then(({ url }) => {
    console.log(`🚀 GraphQL Server is running at ${url}`); // eslint-disable-line no-console
});
