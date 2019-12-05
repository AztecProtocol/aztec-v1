import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
    Text,
} from '@aztec/guacamole-ui';
import formatHash from '~/ui/utils/formatHash';
import styles from './hash.scss';

const HashText = ({
    text,
    prefixLength,
    suffixLength,
    color,
    size,
}) => {
    const hash = prefixLength >= 0 || suffixLength >= 0
        ? formatHash(text, Math.max(0, prefixLength), Math.max(0, suffixLength))
        : text;

    return (
        <Text
            className={classnames(
                'text-code',
                {
                    [styles[`size-${size}`]]: size && size !== 'inherit',
                },
            )}
            text={hash}
            color={color}
        />
    );
};

HashText.propTypes = {
    text: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
    ]).isRequired,
    prefixLength: PropTypes.number,
    suffixLength: PropTypes.number,
    color: PropTypes.string,
    size: PropTypes.string,
};

HashText.defaultProps = {
    prefixLength: -1,
    suffixLength: -1,
    color: '',
    size: '',
};

export default HashText;
