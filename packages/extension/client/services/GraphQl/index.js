import ApolloClient from 'apollo-client';
import { SchemaLink } from 'apollo-link-schema';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { makeExecutableSchema } from 'graphql-tools';

import typeDefs from 'raw-loader!./schema.graphql';

import resolvers from './resolversMessages.js';



const initApollo = () => {

    const schema = makeExecutableSchema({
        typeDefs,
        resolvers,
    });

    const client = new ApolloClient({
        link: new SchemaLink({ schema }),
        cache: new InMemoryCache({
            addTypename: false,
        }),
        connectToDevTools: true,
    });
    return client;
};

export default initApollo;
