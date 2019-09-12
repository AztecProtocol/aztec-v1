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
        } = this.props;
        const {
            params,
        } = action || {};

        return <Component {...params} />;
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
        path: PropTypes.string,
    }),
    Component: PropTypes.func.isRequired,
};

CustomRoute.defaultProps = {
    action: null,
};

export default CustomRoute;
