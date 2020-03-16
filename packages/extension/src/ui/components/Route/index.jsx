import React from 'react';
import PropTypes from 'prop-types';
import {
    Route,
} from 'react-router-dom';

const CustomRoute = ({
    path,
    currentAccount,
    action,
    Component,
    goToPage,
}) => (
    <Route
        path={path}
        component={() => (
            <Component
                {...action}
                currentAccount={currentAccount}
                goToPage={goToPage}
            />
        )}
    />
);

CustomRoute.propTypes = {
    path: PropTypes.string.isRequired,
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
        linkedPublicKey: PropTypes.string,
    }).isRequired,
    action: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
    Component: PropTypes.func.isRequired,
    goToPage: PropTypes.func.isRequired,
};

export default CustomRoute;
