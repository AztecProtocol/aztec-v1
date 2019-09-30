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
            action,
            Component,
            goToPage,
        } = this.props;
        const {
            requestId,
            data,
        } = action || {};

        return (
            <Component
                {...data}
                requestId={requestId}
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
    action: PropTypes.shape({
        requestId: PropTypes.string.isRequired,
        data: PropTypes.object,
    }),
    Component: PropTypes.func.isRequired,
    goToPage: PropTypes.func.isRequired,
};

CustomRoute.defaultProps = {
    action: null,
};

export default CustomRoute;
