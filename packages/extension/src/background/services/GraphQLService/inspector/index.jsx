import React from 'react';
import ReactDOM from 'react-dom';
import { SchemaLink } from 'apollo-link-schema';
import { parse } from 'graphql/language/parser';
import GraphiQL from 'graphiql';
import { execute } from 'apollo-link';
import { makeExecutableSchema } from 'graphql-tools';
import 'graphiql/graphiql.css';
import 'normalize.css';
import typeDefs from '../typeDefs/background';
import resolvers from '../resolvers/background';

const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
});
const link = new SchemaLink({ schema });

const fetcher = ({ query, variables = {} }) => execute(
    link,
    {
        query: parse(query),
        variables,
    },
);

ReactDOM.render(
    <GraphiQL
        fetcher={fetcher}
    />,
    document.getElementById('graphql-inspector'),
);
