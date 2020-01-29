import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter as Router } from 'react-router-dom';
import App from './App';

ReactDOM.render(
    <Router>
        <App />
    </Router>,
    document.getElementById('aztec-popup-ui-app'),
);
