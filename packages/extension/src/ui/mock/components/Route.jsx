import React from 'react';
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

const getInitialDataByName = (nameArr) => {
    let accumName = '';
    return nameArr.reduce((data, name) => {
        accumName = `${accumName}${name}`;
        let newData = initialProps[accumName];
        if (typeof newData === 'function') {
            newData = newData();
        }
        accumName = `${accumName}.`;
        return newData
            ? {
                ...data,
                ...newData,
            }
            : data;
    }, {});
};

const MockRoute = ({
    path,
    name,
    Component,
}) => {
    const nameArr = name.split('.');
    const {
        initialStep,
    } = getConfigByName(nameArr) || {};
    const initialData = getInitialDataByName(nameArr);
    const {
        currentAccount,
        ...props
    } = initialData;

    return (
        <Route
            path={path}
            component={() => (
                <Popup site={sites[0]}>
                    <Component
                        {...props}
                        site={sites[0]}
                        currentAccount={currentAccount || {
                            address: addresses[0],
                        }}
                        initialStep={initialStep}
                    />
                </Popup>
            )}
        />
    );
};

MockRoute.propTypes = {
    path: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    Component: PropTypes.func.isRequired,
};

export default MockRoute;
