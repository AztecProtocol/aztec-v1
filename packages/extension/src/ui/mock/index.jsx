import React from 'react';
import ReactDOM from 'react-dom';
import {
    HashRouter as Router,
} from 'react-router-dom';
import App from '../App';
import ControlPanel from './ControlPanel';
import '../styles/background.scss';
import './window';

ReactDOM.render(
    <Router>
        <ControlPanel>
            <App mock />
        </ControlPanel>
    </Router>,
    document.getElementById('mock-app'),
);
