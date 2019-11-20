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
import apis from '~uiModules/apis';
import i18n from '~ui/helpers/i18n';
import router from '~ui/helpers/router';
import getPathsFromRouteConfig from '~ui/utils/getPathsFromRouteConfig';
import ThemeContext from '~ui/views/handlers/ThemeContext';
import Loading from '~ui/views/Loading';
import routes from '~uiModules/config/routes';
import actions from '~ui/config/actions';
import getGsnConfig from '~client/config/getGsnConfig';
import './styles/guacamole.css';
import './styles/_reset.scss';

class App extends PureComponent {
    constructor(props) {
        super(props);

        const {
            locale,
            mock,
        } = props;

        this.state = {
            loading: !mock,
            currentAccount: null,
            gsnConfig: {},
            action: null,
            nextRoute: '',
        };

        const phrases = require(`./locales/${locale}`).default; // eslint-disable-line global-require, import/no-dynamic-require
        i18n.setLocale(locale);
        i18n.register(phrases);

        const paths = getPathsFromRouteConfig(routes);
        router.register(paths);
    }

    async componentDidMount() {
        const {
            mock,
        } = this.props;
        if (mock) return;

        await ConnectionService.openConnection();
        await this.loadInitialStates();
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
        const action = await ActionService.last();
        const gsnConfig = await getGsnConfig();
        if (!action) return;

        let route;
        if (action.requestId) {
            const {
                type,
                requestId,
            } = action;
            ConnectionService.setDefaultClientRequestId(requestId);
            ({
                route,
            } = actions[type] || {});
        }

        const {
            data: {
                currentAddress,
            },
        } = action;
        const currentAccount = {
            address: currentAddress,
        };

        if (!route
            || route === 'register'
        ) {
            const {
                linkedPublicKey: onChainLinkedPublicKey,
            } = await apis.account.getExtensionAccount(currentAccount.address) || {};
            currentAccount.linkedPublicKey = onChainLinkedPublicKey;
            const {
                address: localAddress,
                linkedPublicKey: localLinkedPublicKey,
                validSession,
            } = await apis.account.getLocalAccount() || {};

            if (onChainLinkedPublicKey) {
                if (localAddress === currentAddress
                    && localLinkedPublicKey === onChainLinkedPublicKey
                ) {
                    route = 'account.login';
                } else {
                    route = 'account.restore';
                }
            } else if (validSession
                && localLinkedPublicKey
                && localAddress !== currentAddress
            ) {
                route = 'register.address';
                currentAccount.linkedPublicKey = localLinkedPublicKey;
            }
        }
        if (!this.isCurrentPage(route)) {
            this.setState(
                {
                    nextRoute: route,
                    action,
                    currentAccount,
                    gsnConfig,
                },
                () => this.goToPage(route),
            );
            return;
        }

        this.setState({
            loading: false,
            action,
            currentAccount,
        });
    }

    renderRoutes(config, parent = {}) {
        const routeNodes = [];
        let defaultRoute;
        const {
            currentAccount,
            action,
            gsnConfig,
        } = this.state;

        Object.keys(config).forEach((subName) => {
            const {
                Component,
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

            if (Component) {
                const routeNode = (
                    <Route
                        key={path}
                        name={name}
                        path={path}
                        gsnConfig={gsnConfig}
                        currentAccount={currentAccount}
                        action={action}
                        goToPage={this.goToPage}
                        Component={Component}
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

        const theme = {
            name: 'light',
        };

        return (
            <ThemeContext.Provider value={theme}>
                <Switch>
                    {this.renderRoutes(routes)}
                </Switch>
            </ThemeContext.Provider>
        );
    }
}

App.propTypes = {
    locale: PropTypes.string,
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
    locale: 'en',
    mock: false,
};

export default withRouter(App);
