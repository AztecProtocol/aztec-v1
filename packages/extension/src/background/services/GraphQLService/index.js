import ApolloClient from 'apollo-client';
import { SchemaLink } from 'apollo-link-schema';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { makeExecutableSchema } from 'graphql-tools';
import typeDefs from './typeDefs';
import resolvers from './resolvers';

const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
});

const apollo = new ApolloClient({
    link: new SchemaLink({ schema }),
    cache: new InMemoryCache({
        addTypename: false,
    }),
    connectToDevTools: true,
});

export default {
    query: async (query) => {
        const response = await apollo.query(query);
        const {
            data,
        } = response || {};

        return data;
    },
};
