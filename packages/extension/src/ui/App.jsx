import React, {
    PureComponent,
} from 'react';
import PropTypes from 'prop-types';
import {
    Switch,
    withRouter,
} from 'react-router-dom';
import Route from '~uiModules/components/Route';
import ConnectionService from '~/ui/services/ConnectionService';
import Web3Service from '~/helpers/Web3Service';
import apis from '~uiModules/apis';
import i18n from '~/ui/helpers/i18n';
import router from '~/ui/helpers/router';
import getPathsFromRouteConfig from '~/ui/utils/getPathsFromRouteConfig';
import ThemeContext from '~/ui/views/handlers/ThemeContext';
import Loading from '~/ui/views/Loading';
import routes from '~uiModules/config/routes';
import actions from '~/ui/config/actions';
import getAuthRoute from '~/ui/utils/getAuthRoute';
import ensureMinPendingTime from '~/ui/utils/ensureMinPendingTime';
import getGsnConfig from '~/utils/getGSNConfig';
import './styles/guacamole.css';
import './styles/ui.scss';

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

        await ConnectionService.openConnection(this.handleNewAction);
    }

    componentDidUpdate() {
        this.confirmRedirect();
    }

    handleNewAction = (action) => {
        if (action.type === 'closed') {
            this.setState({
                loading: true,
                nextRoute: '',
            });
        } else {
            this.loadActionStates(action);
        }
    };

    goToPage = (route) => {
        if (route === 'loading') {
            this.setState({
                loading: true,
                nextRoute: '',
            });
            return;
        }

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
            loading,
        } = this.state;
        if (loading && nextRoute && this.isCurrentPage(nextRoute)) {
            this.setState({
                nextRoute: '',
                loading: false,
            });
        }
    }

    async loadActionStates(action) {
        if (!action) return;

        const startTime = Date.now();

        const gsnConfig = await getGsnConfig();

        const {
            type,
            data: actionData,
        } = action;
        const {
            address: currentAddress,
        } = Web3Service.account;
        const currentAccount = {
            address: currentAddress,
        };
        let route;
        ({
            route,
        } = actions[type] || {});

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
            route = getAuthRoute({
                onChainLinkedPublicKey,
                localLinkedPublicKey,
                validSession,
                localAddress,
                currentAddress,
            });

            if (route === 'register.address') {
                currentAccount.linkedPublicKey = localLinkedPublicKey;
            }
        }

        const nextState = {
            nextRoute: route,
            action: actionData,
            currentAccount,
            gsnConfig,
        };

        const minDelayTime = Math.max(0, 2000 - (Date.now() - startTime));
        if (this.isCurrentPage(route)) {
            setTimeout(() => {
                this.setState(nextState);
            }, minDelayTime);
        } else {
            this.setState(
                nextState,
                ensureMinPendingTime(() => this.goToPage(route), minDelayTime),
            );
        }
    }

    renderRoutes(config, parent = {}) {
        const routeNodes = [];
        let defaultRoute;
        const {
            mock,
        } = this.props;
        const {
            currentAccount,
            action,
            gsnConfig,
        } = this.state;

        Object.keys(config).forEach((subName) => {
            const {
                Component,
                Content,
                step,
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

            if (Component || (mock && (step || Content))) {
                const routeNode = (
                    <Route
                        key={path}
                        name={name}
                        path={path}
                        gsnConfig={gsnConfig}
                        currentAccount={currentAccount}
                        action={action}
                        Component={Component}
                        goToPage={this.goToPage}
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
