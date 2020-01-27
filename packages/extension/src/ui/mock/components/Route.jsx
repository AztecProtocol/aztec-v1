import React from 'react';
import PropTypes from 'prop-types';
import {
    Route,
} from 'react-router-dom';
import Popup from '~/ui/components/Popup';
import StepsHandler from '~/ui/views/handlers/StepsHandler';
import AnimatedTransaction from '~/ui/views/handlers/AnimatedTransaction';
import routes from '../config/routes';
import {
    addresses,
    sites,
    gsnConfig,
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
            newData = newData(data);
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
        steps,
        initialStep,
        step,
        Content,
    } = getConfigByName(nameArr) || {};
    const initialData = getInitialDataByName(nameArr);
    const {
        currentAccount,
        ...props
    } = initialData;
    let contentNode;
    if (Content) {
        contentNode = (
            <StepsHandler
                steps={steps}
                initialStep={initialStep}
                initialData={initialData}
                Content={Content}
            />
        );
    } else if (Component) {
        contentNode = (
            <Component
                {...props}
                site={sites[0]}
                currentAccount={currentAccount || {
                    address: addresses[0],
                }}
                gsnConfig={gsnConfig}
                initialStep={initialStep}
            />
        );
    } else {
        contentNode = (
            <AnimatedTransaction
                steps={[step]}
                initialData={initialData}
            />
        );
    }

    return (
        <Route
            path={path}
            component={() => (
                <Popup
                    site={sites[0]}
                    onClose={() => {}}
                >
                    {contentNode}
                </Popup>
            )}
        />
    );
};

MockRoute.propTypes = {
    path: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    Content: PropTypes.func,
    Component: PropTypes.func,
};

MockRoute.defaultProps = {
    Content: null,
    Component: null,
};

export default MockRoute;
