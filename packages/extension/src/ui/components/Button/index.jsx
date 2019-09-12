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
    disabled,
    ...props
}) => (
    <Button
        className={classnames(
            className,
            styles[theme],
            {
                [styles.outlined]: outlined,
                [styles.disabled]: disabled,
            },
        )}
        rounded
        disabled={disabled}
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
    disabled: PropTypes.bool,
};

CustomButton.defaultProps = {
    className: '',
    theme: 'primary',
    outlined: false,
    disabled: false,
};

export default CustomButton;
