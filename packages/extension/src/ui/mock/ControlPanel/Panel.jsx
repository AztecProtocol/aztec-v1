import React from 'react';
import { Link } from 'react-router-dom';
import {
    Block,
    TextButton,
    Text,
} from '@aztec/guacamole-ui';
import routes from '~uiModules/config/routes';

const formatName = (name) => {
    if (name === '_') {
        return 'Landing';
    }

    return `${name[0].toUpperCase()}${name.slice(1)}`;
};

const renderRouteNodes = (config, pathPrefix) => Object.keys(config).map((name) => {
    const {
        path: subPath,
        routes: childRoutes,
        Component,
        Content,
        step,
    } = config[name];
    const path = `${pathPrefix || ''}/${subPath || ''}`;
    const canRender = !!(Component || Content || step);

    let childRouteNodes;
    if (childRoutes) {
        childRouteNodes = renderRouteNodes(childRoutes, path);
    } else if (!canRender) {
        return null;
    }

    return (
        <Block
            key={name}
            padding={pathPrefix ? 'xs s' : 's'}
            hasBorderBottom={!pathPrefix}
        >
            {canRender && (
                <TextButton
                    text={formatName(name)}
                    href={path}
                    Link={Link}
                    size="xxs"
                />
            )}
            {!canRender && (
                <Text
                    text={formatName(name)}
                    color="label"
                    size="xxs"
                />
            )}
            {!!childRouteNodes && (
                <Block left="l">
                    {childRouteNodes}
                </Block>
            )}
        </Block>
    );
});

const Panel = () => (
    <div>
        {renderRouteNodes(routes)}
    </div>
);

export default Panel;
