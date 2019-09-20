import React, {
    PureComponent,
} from 'react';
import PropTypes from 'prop-types';
import {
    Switch,
    withRouter,
} from 'react-router-dom';
import Route from '~uiModules/components/Route';
import ActionService from '~uiModules/services/ActionService';
import i18n from '~ui/helpers/i18n';
import router from '~ui/helpers/router';
import getPathsFromRouteConfig from '~ui/utils/getPathsFromRouteConfig';
import Loading from '~ui/views/Loading';
import routes from '~ui/config/routes';
import actions from '~ui/config/actions';

class App extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            initialAction: null,
            nextRoute: '',
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
        this.loadInitialStates();
    }

    componentDidUpdate() {
        this.confirmRedirect();
    }

    goToPage = (route) => {
        const {
            history,
        } = this.props;
        const pageUrl = router.u(route);
        history.push(pageUrl);
    };

    isCurrentPage = (name) => {
        const {
            location,
        } = this.props;
        const pathUrl = router.u(name);
        return pathUrl === location.pathname;
    };

    confirmRedirect() {
        const {
            nextRoute,
        } = this.state;
        if (nextRoute && this.isCurrentPage(nextRoute)) {
            this.setState({
                nextRoute: '',
                loading: false,
            });
        }
    }

    async loadInitialStates() {
        const {
            location,
        } = this.props;
        const search = new URLSearchParams(location.search);
        const actionId = search.get('id');

        let route;
        let initialAction;
        if (actionId) {
            initialAction = await ActionService.get(actionId);
            const {
                key: actionKey,
            } = initialAction || {};
            ({
                route,
            } = actions[actionKey] || {});
        } else {
            const isLoggedIn = await ActionService.isLoggedIn();
            route = isLoggedIn ? 'account' : 'welcome';
        }

        if (route && !this.isCurrentPage(route)) {
            this.setState(
                {
                    nextRoute: route,
                    initialAction,
                },
                () => this.goToPage(route),
            );
            return;
        }

        this.setState({
            loading: false,
            initialAction,
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
                        goToPage={this.goToPage}
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
            loading,
        } = this.state;

        if (loading) {
            return <Loading />;
        }

        return (
            <Switch>
                {this.renderRoutes(routes)}
            </Switch>
        );
    }
}

App.propTypes = {
    history: PropTypes.shape({
        push: PropTypes.func.isRequired,
    }).isRequired,
    location: PropTypes.shape({
        pathname: PropTypes.string.isRequired,
        search: PropTypes.string.isRequired,
    }).isRequired,
};

export default withRouter(App);
