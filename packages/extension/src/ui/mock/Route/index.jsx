import React, {
    PureComponent,
} from 'react';
import PropTypes from 'prop-types';
import {
    withRouter,
    Route,
} from 'react-router-dom';
import initialProps from '../initialProps';

class MockRoute extends PureComponent {
    goToPage = (pageUrl) => {
        const {
            history,
        } = this.props;
        history.push(pageUrl);
    };

    renderComponent = () => {
        const {
            path,
            action,
            history,
            Component,
        } = this.props;
        const {
            params,
        } = action || {};
        const {
            prev,
            next,
            ...props
        } = initialProps[path] || {};
        const handleGoBack = prev
            ? () => history.push(prev)
            : null;
        const handleGoNext = next
            ? () => history.push(next)
            : null;

        return (
            <Component
                goBack={handleGoBack}
                goNext={handleGoNext}
                goToPage={this.goToPage}
                {...params}
                {...props}
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
    action: PropTypes.shape({
        path: PropTypes.string,
    }),
    Component: PropTypes.func.isRequired,
    history: PropTypes.shape({
        push: PropTypes.func.isRequired,
    }).isRequired,
};

MockRoute.defaultProps = {
    action: null,
};

export default withRouter(MockRoute);
