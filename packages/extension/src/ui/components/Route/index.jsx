import React, {
    PureComponent,
} from 'react';
import PropTypes from 'prop-types';
import {
    Route,
} from 'react-router-dom';

class CustomRoute extends PureComponent {
    renderComponent = () => {
        const {
            currentAccount,
            action,
            Component,
            goToPage,
        } = this.props;
        const {
            id: actionId,
            site,
            data,
        } = action || {};

        return (
            <Component
                {...data}
                actionId={actionId}
                site={site}
                currentAccount={currentAccount}
                goToPage={goToPage}
            />
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

CustomRoute.propTypes = {
    path: PropTypes.string.isRequired,
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
        linkedPublicKey: PropTypes.string,
    }).isRequired,
    action: PropTypes.shape({
        id: PropTypes.string.isRequired,
        site: PropTypes.shape({
            title: PropTypes.string.isRequired,
            url: PropTypes.string.isRequired,
            icons: PropTypes.arrayOf(PropTypes.shape({
                href: PropTypes.string.isRequired,
                size: PropTypes.string,
            })).isRequired,
        }).isRequired,
        data: PropTypes.object,
    }),
    Component: PropTypes.func.isRequired,
    goToPage: PropTypes.func.isRequired,
};

CustomRoute.defaultProps = {
    action: null,
};

export default CustomRoute;
