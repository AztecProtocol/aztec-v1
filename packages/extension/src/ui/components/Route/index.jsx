import React from 'react';
import PropTypes from 'prop-types';
import {
    Route,
} from 'react-router-dom';
import {
    gsnConfigShape,
} from '~/ui/config/propTypes';

const CustomRoute = ({
    path,
    currentAccount,
    action,
    Component,
    gsnConfig,
}) => (
    <Route
        path={path}
        component={() => (
            <Component
                {...action}
                gsnConfig={gsnConfig}
                currentAccount={currentAccount}
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
    gsnConfig: gsnConfigShape.isRequired,
};

export default CustomRoute;
