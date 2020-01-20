import ApolloClient from 'apollo-client';
import { SchemaLink } from 'apollo-link-schema';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { makeExecutableSchema } from 'graphql-tools';
import gql from 'graphql-tag';
import typeDefs from '~/background/services/GraphQLService/typeDefs/ui';
import resolvers from '~/background/services/GraphQLService/resolvers/ui';

const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
});

const apollo = new ApolloClient({
    link: new SchemaLink({ schema }),
    cache: new InMemoryCache({
        addTypename: false,
    }),
    defaultOptions: {
        query: {
            fetchPolicy: 'no-cache',
        },
        watchQuery: {
            fetchPolicy: 'no-cache',
        },
    },
    connectToDevTools: true,
});

export default {
    mutate: async (...args) => {
        const response = await apollo.mutate(...args);
        return (response && response.data) || response;
    },
    query: async (...args) => {
        let response;
        if (typeof args[0] !== 'string') {
            response = await apollo.query(...args);
        } else {
            response = await apollo.query({
                query: gql(`query {${args[0]}}`),
            });
        }
        return (response && response.data) || response;
    },
};
