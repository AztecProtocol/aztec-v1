import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
    Button,
} from '@aztec/guacamole-ui';
import {
    themeType,
} from '~ui/config/propTypes';
import styles from './button.scss';

const CustomButton = ({
    className,
    theme,
    outlined,
    rounded,
    disabled,
    loading,
    ...props
}) => (
    <Button
        className={classnames(
            className,
            {
                [styles[theme]]: theme === 'primary',
                [styles.outlined]: outlined,
                [styles.disabled]: disabled,
                [styles.loading]: loading,
            },
        )}
        theme={theme}
        rounded={rounded}
        disabled={disabled}
        outlined={outlined}
        isLoading={loading}
        {...props}
    />
);

CustomButton.propTypes = {
    className: PropTypes.string,
    theme: themeType,
    outlined: PropTypes.bool,
    rounded: PropTypes.bool,
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
};

CustomButton.defaultProps = {
    className: '',
    theme: 'primary',
    outlined: false,
    rounded: true,
    disabled: false,
    loading: false,
};

export default CustomButton;
