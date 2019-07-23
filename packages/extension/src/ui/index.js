import React from 'react';
import ReactDOM from 'react-dom';
import { ApolloProvider } from 'react-apollo';
import GraphQLService from '../background/services/GraphQLService';
import App from './App.jsx';

ReactDOM.render(
    <ApolloProvider client={GraphQLService.apollo}>
        <App />
    </ApolloProvider>
        , document.getElementById('app'));
