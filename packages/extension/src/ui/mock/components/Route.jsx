import React, {
    PureComponent,
} from 'react';
import PropTypes from 'prop-types';
import {
    Route,
} from 'react-router-dom';
import Popup from '~/ui/components/Popup';
import {
    addresses,
    sites,
} from '../data';
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
            id: actionId,
            data,
        } = action || {};
        let childProps = initialProps[name];
        if (typeof childProps === 'function') {
            childProps = childProps();
        }
        const {
            prev,
            next,
            ...props
        } = childProps || {};
        const handleGoBack = prev
            ? () => goToPage(prev)
            : null;
        const handleGoNext = next
            ? () => goToPage(next)
            : null;
        const currentAccount = {
            address: addresses[0],
        };

        const contentNode = (
            <Component
                clientRequestId="client-request-id"
                actionId={actionId}
                site={sites[0]}
                currentAccount={currentAccount}
                goBack={handleGoBack}
                goNext={handleGoNext}
                goToPage={goToPage}
                {...props}
                {...data}
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
    goToPage: PropTypes.func.isRequired,
};

MockRoute.defaultProps = {
    action: null,
};

export default MockRoute;
