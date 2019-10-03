import React, {
    PureComponent,
} from 'react';
import PropTypes from 'prop-types';
import {
    Switch,
    withRouter,
} from 'react-router-dom';
import Route from '~uiModules/components/Route';
import ConnectionService from '~ui/services/ConnectionService';
import ActionService from '~uiModules/services/ActionService';
import i18n from '~ui/helpers/i18n';
import router from '~ui/helpers/router';
import getPathsFromRouteConfig from '~ui/utils/getPathsFromRouteConfig';
import Loading from '~ui/views/Loading';
import routes from '~ui/config/routes';
import actions from '~ui/config/actions';
import {
    isLoggedIn,
} from '~ui/apis/auth';
import './styles/guacamole.css';
import './styles/_reset.scss';

class App extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            action: null,
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
        ConnectionService.openConnection();
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
        const search = new URLSearchParams(window.location.search);
        const actionId = search.get('id');

        let route;
        let action;
        if (actionId) {
            action = await ActionService.get(actionId);
            if (action) {
                const {
                    type,
                    requestId,
                } = action;

                ({
                    route,
                } = actions[type] || {});

                ConnectionService.setDefaultClientRequestId(requestId);
            }
        }
        if (!route) {
            const {
                mock,
            } = this.props;
            if (mock) {
                this.setState({
                    nextRoute: '/',
                    loading: false,
                });
                return;
            }
            const loggedIn = await isLoggedIn();
            route = loggedIn ? 'account' : 'welcome';
        }

        if (!this.isCurrentPage(route)) {
            this.setState(
                {
                    nextRoute: route,
                    action,
                },
                () => this.goToPage(route),
            );
            return;
        }

        this.setState({
            loading: false,
            action,
        });
    }

    renderRoutes(config, parent = {}) {
        const routeNodes = [];
        let defaultRoute;
        const {
            action,
        } = this.state;
        const {
            mock,
        } = this.props;

        Object.keys(config).forEach((subName) => {
            const {
                Component,
                View,
                path: subPath,
                routes: childRoutes,
            } = config[subName];
            const {
                path: parentPath,
                name: parentName,
            } = parent;
            const childPath = (subPath || subName || '').replace(/^_$/, '');
            const path = `${parentPath || ''}/${childPath}`.replace(/\/{2,}/g, '/');
            const name = parentName ? `${parentName}.${subName}` : subName;

            if (childRoutes) {
                const childRouteNodes = this.renderRoutes(childRoutes, {
                    path,
                    name,
                });
                routeNodes.push(...childRouteNodes);
            }

            if (Component
                || (View && process.env.NODE_ENV === 'development')
            ) {
                const routeNode = (
                    <Route
                        key={path}
                        name={name}
                        path={path}
                        action={action}
                        goToPage={this.goToPage}
                        Component={mock
                            ? View || Component
                            : Component || View
                        }
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
    mock: PropTypes.bool,
};

App.defaultProps = {
    mock: false,
};

export default withRouter(App);
