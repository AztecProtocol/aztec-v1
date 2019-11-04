import React, {
    PureComponent,
} from 'react';
import PropTypes from 'prop-types';
import {
    Route,
} from 'react-router-dom';
import {
    siteShape,
} from '~/ui/config/propTypes';
import Popup from '~ui/components/Popup';

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
            <Popup site={site}>
                <Component
                    {...data}
                    actionId={actionId}
                    currentAccount={currentAccount}
                    goToPage={goToPage}
                />
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

CustomRoute.propTypes = {
    path: PropTypes.string.isRequired,
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
        linkedPublicKey: PropTypes.string,
    }).isRequired,
    action: PropTypes.shape({
        id: PropTypes.string.isRequired,
        site: siteShape.isRequired,
        data: PropTypes.object,
    }),
    Component: PropTypes.func.isRequired,
    goToPage: PropTypes.func.isRequired,
};

CustomRoute.defaultProps = {
    action: null,
};

export default CustomRoute;
