import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
    Button,
} from '@aztec/guacamole-ui';
import styles from './button.scss';

const CustomButton = ({
    className,
    theme,
    outlined,
    rounded,
    disabled,
    ...props
}) => (
    <Button
        className={classnames(
            className,
            {
                [styles[theme]]: theme === 'primary',
                [styles.outlined]: outlined,
                [styles.disabled]: disabled,
            },
        )}
        theme={theme}
        rounded={rounded}
        disabled={disabled}
        outlined={outlined}
        {...props}
    />
);

CustomButton.propTypes = {
    className: PropTypes.string,
    theme: PropTypes.oneOf([
        'primary',
        'white',
    ]),
    outlined: PropTypes.bool,
    rounded: PropTypes.bool,
    disabled: PropTypes.bool,
};

CustomButton.defaultProps = {
    className: '',
    theme: 'primary',
    outlined: false,
    rounded: true,
    disabled: false,
};

export default CustomButton;
