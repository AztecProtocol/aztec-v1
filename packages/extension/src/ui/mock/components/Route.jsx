import React, {
    PureComponent,
} from 'react';
import PropTypes from 'prop-types';
import {
    Route,
} from 'react-router-dom';
import Popup from '~/ui/components/Popup';
import routes from '../config/routes';
import {
    addresses,
    sites,
} from '../data';
import initialProps from '../initialProps';

const getConfigByName = (nameArr, routeConfig = routes) => {
    const [name, ...childNames] = nameArr;
    const config = routeConfig[name];
    if (childNames && childNames.length) {
        return getConfigByName(childNames, config.routes);
    }

    return config;
};

class MockRoute extends PureComponent {
    renderComponent = () => {
        const {
            name,
            action,
            Component,
        } = this.props;
        const {
            id: actionId,
            data,
        } = action || {};
        let childProps = initialProps[name];
        if (typeof childProps === 'function') {
            childProps = childProps();
        }
        const {
            currentAccount,
            ...props
        } = childProps || {};

        const {
            initialStep,
        } = getConfigByName(name.split('.')) || {};

        const initialData = {
            ...data,
            ...props,
        };

        const contentNode = (
            <Component
                clientRequestId="client-request-id"
                actionId={actionId}
                site={sites[0]}
                currentAccount={currentAccount || {
                    address: addresses[0],
                }}
                initialStep={initialStep}
                initialData={initialData}
            />
        );

        return (
            <Popup site={sites[0]}>
                {contentNode}
            </Popup>
        );
    };

    render() {
        const {
            path,
        } = this.props;

        return (
            <Route
                path={path}
                component={this.renderComponent}
            />
        );
    }
}

MockRoute.propTypes = {
    path: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    action: PropTypes.shape({
        id: PropTypes.string.isRequired,
        data: PropTypes.object,
    }),
    Component: PropTypes.func.isRequired,
};

MockRoute.defaultProps = {
    action: null,
};

export default MockRoute;
