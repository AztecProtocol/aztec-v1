import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
    avatarSizesMap,
} from '~ui/styles/guacamole-vars';
import generateSvgProps from './utils/generateSvgProps';
import styles from './svg.scss';

const ProfileSvg = ({
    className,
    address,
    size,
    alt,
}) => {
    const diameter = parseInt(avatarSizesMap[size], 10);
    const {
        children,
        ...svgProps
    } = generateSvgProps(address, diameter);

    return (
        <div
            className={classnames(
                className,
                styles.profile,
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
        </div>
    );
};

ProfileSvg.propTypes = {
    className: PropTypes.string,
    address: PropTypes.string.isRequired,
    alt: PropTypes.string,
    size: PropTypes.oneOf(Object.keys(avatarSizesMap)),
};

ProfileSvg.defaultProps = {
    className: '',
    alt: '',
    size: 'm',
};

export default ProfileSvg;
