import React from 'react';
import ReactDOM from 'react-dom';
import { ApolloProvider } from 'react-apollo';
import { HashRouter as Router  } from 'react-router-dom';
import GraphQLService from '../background/services/GraphQLService';
import App from './App.jsx';

ReactDOM.render(
    <ApolloProvider client={GraphQLService.apollo}>
        <Router >
            <App />
        </Router>
    </ApolloProvider>
        , document.getElementById('app'));
