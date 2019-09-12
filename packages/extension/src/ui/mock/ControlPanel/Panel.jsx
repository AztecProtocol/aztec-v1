import React from 'react';
import { Link } from 'react-router-dom';
import {
    Block,
    TextButton,
} from '@aztec/guacamole-ui';
import routes from '../../config/routes';

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
    } = config[name];
    const path = `${pathPrefix || ''}/${subPath || ''}`;

    let childRouteNodes;
    if (childRoutes) {
        childRouteNodes = renderRouteNodes(childRoutes, path);
    }

    return (
        <Block
            key={name}
            padding="m"
            hasBorderBottom={!pathPrefix}
        >
            <TextButton
                text={formatName(name)}
                href={path}
                Link={Link}
            />
            {!!childRouteNodes && (
                <Block
                    top="s"
                    left="l"
                >
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
