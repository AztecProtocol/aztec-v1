import React, {
    PureComponent,
} from 'react';
import PropTypes from 'prop-types';
import {
    Route,
} from 'react-router-dom';
import initialProps from '../initialProps';

class MockRoute extends PureComponent {
    renderComponent = () => {
        const {
            name,
            action,
            Component,
            goToPage,
        } = this.props;
        const {
            data,
        } = action || {};
        const {
            prev,
            next,
            ...props
        } = initialProps[name] || {};
        const handleGoBack = prev
            ? () => goToPage(prev)
            : null;
        const handleGoNext = next
            ? () => goToPage(next)
            : null;

        return (
            <Component
                clientRequestId="client-request-id"
                goBack={handleGoBack}
                goNext={handleGoNext}
                goToPage={goToPage}
                {...props}
                {...data}
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

MockRoute.propTypes = {
    path: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    action: PropTypes.shape({
        key: PropTypes.string.isRequired,
        data: PropTypes.object,
    }),
    Component: PropTypes.func.isRequired,
    goToPage: PropTypes.func.isRequired,
};

MockRoute.defaultProps = {
    action: null,
};

export default MockRoute;
