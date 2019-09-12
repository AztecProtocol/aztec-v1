import React, {
    PureComponent,
} from 'react';
import {
    Switch,
} from 'react-router-dom';
import Route from '~uiRoute';
import actionModel from '~database/models/action';
import i18n from './helpers/i18n';
import router from './helpers/router';
import getPathsFromRouteConfig from './utils/getPathsFromRouteConfig';
import ActionService from './services/ActionService';
import Loading from './views/Loading';
import routes from './config/routes';

class App extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            initialAction: null,
        };
    }

    componentWillMount(locale = 'en') {
        const phrases = require(`./locales/${locale}`).default; // eslint-disable-line global-require, import/no-dynamic-require
        i18n.setLocale(locale);
        i18n.register(phrases);

        const paths = getPathsFromRouteConfig(routes);
        router.register(paths);
    }

    componentDidMount() {
        ActionService.openConnection();
        this.loadInitialAction();
    }

    async loadInitialAction() {
        const action = await actionModel.get();
        this.setState({
            initialAction: action || {},
        });
    }

    renderRoutes(config, pathPrefix = '') {
        const routeNodes = [];
        let defaultRoute;
        const {
            initialAction,
        } = this.state;

        Object.keys(config).forEach((name) => {
            const {
                Component,
                View,
                path: subPath,
                routes: childRoutes,
            } = config[name];
            const path = `${pathPrefix}/${subPath || ''}`;

            if (childRoutes) {
                const childRouteNodes = this.renderRoutes(childRoutes, path);
                routeNodes.push(...childRouteNodes);
            }

            if (Component
                || (View && process.env.NODE_ENV === 'development')
            ) {
                const routeNode = (
                    <Route
                        key={path}
                        path={path}
                        action={initialAction}
                        Component={Component || View}
                    />
                );

                if (name === '_') {
                    defaultRoute = routeNode;
                } else {
                    routeNodes.push(routeNode);
                }
            }
        });
        if (defaultRoute) {
            routeNodes.push(defaultRoute);
        }

        return routeNodes;
    }

    render() {
        const {
            initialAction,
        } = this.state;

        if (!initialAction) {
            return <Loading />;
        }

        return (
            <Switch>
                {this.renderRoutes(routes)}
            </Switch>
        );
    }
}

export default App;
