import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
    avatarSizesMap,
} from '~/ui/styles/guacamole-vars';
import {
    makeRand,
    makeRandomInt,
} from '~/utils/random';
import defaultColorScheme from './config/colorScheme';
import defaultShapeGenerator from './utils/shapeGenerator';
import styles from './svg.scss';

const ProfileSvg = ({
    className,
    address,
    size,
    alt,
    colorScheme,
    shapeGenerator,
    children: childNode,
}) => {
    const diameter = parseInt(avatarSizesMap[size], 10);
    const rand = makeRand(address);
    const randomInt = makeRandomInt(rand);
    const {
        children,
        ...svgProps
    } = shapeGenerator({
        seed: address,
        diameter,
        colorScheme,
        rand,
        randomInt,
    });

    return (
        <div
            className={classnames(
                className,
                styles.profile,
                styles[`size-${size}`],
            )}
            title={alt || address}
        >
            <svg {...svgProps}>
                {children.map(({
                    type: Tag,
                    ...props
                }, i) => (
                    <Tag
                        key={+i}
                        {...props}
                    />
                ))}
            </svg>
            {childNode}
        </div>
    );
};

ProfileSvg.propTypes = {
    className: PropTypes.string,
    address: PropTypes.string.isRequired,
    alt: PropTypes.string,
    size: PropTypes.oneOf(Object.keys(avatarSizesMap)),
    colorScheme: PropTypes.arrayOf(PropTypes.string),
    shapeGenerator: PropTypes.func,
    children: PropTypes.node,
};

ProfileSvg.defaultProps = {
    className: '',
    alt: '',
    size: 'm',
    colorScheme: defaultColorScheme,
    shapeGenerator: defaultShapeGenerator,
    children: null,
};

export default ProfileSvg;
