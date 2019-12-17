import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
    SVG,
} from '@aztec/guacamole-ui';
import {
    avatarSizesMap,
} from '~/ui/styles/guacamole-vars';
import {
    themeType,
} from '~/ui/config/propTypes';
import aztecGlyph from '~/ui/images/logo.svg';
import aztecWhiteGlyph from '~/ui/images/logo-white.svg';
import styles from './svg.scss';

const AztecSvg = ({
    className,
    theme,
    size,
}) => {
    const diameter = parseInt(avatarSizesMap[size], 10);

    return (
        <div
            className={classnames(
                className,
                styles[`theme-${theme}`],
                styles[`size-${size}`],
            )}
        >
            <SVG
                glyph={theme === 'light' ? aztecWhiteGlyph : aztecGlyph}
                width={diameter}
                height={diameter}
            />
        </div>
    );
};

AztecSvg.propTypes = {
    className: PropTypes.string,
    theme: themeType,
    size: PropTypes.string,
};

AztecSvg.defaultProps = {
    className: '',
    theme: 'light',
    size: 'm',
};

export default AztecSvg;
