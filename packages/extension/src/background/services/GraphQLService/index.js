import ApolloClient from 'apollo-client';
import { SchemaLink } from 'apollo-link-schema';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { makeExecutableSchema } from 'graphql-tools';
import {
    dataError,
} from '~utils/error';
import errorResponse from './utils/errorResponse';
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

const formatError = (error, request) => {
    if (error.graphQLErrors) {
        return errorResponse(dataError('data.graphql', {
            graphQLErrors: error.graphQLErrors,
            ...request,
        }));
    }
    return error;
};

export default {
    query: async (query) => {
        try {
            const response = await apollo.query(query);
            const {
                data,
            } = response || {};
            return {
                ...data,
                requestId: query.requestId,

            };
        } catch (e) {
            return formatError(e, query);
        }
    },
    mutation: async (mutation) => {
        try {
            const response = await apollo.mutate(mutation);
            const {
                data,
            } = response || {};
            return {
                ...data,
                requestId: mutation.requestId,
            };
        } catch (e) {
            return formatError(e, mutation);
        }
    },
    apollo,
};
