import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
    Button,
} from '@aztec/guacamole-ui';
import {
    themeType,
} from '~/ui/config/propTypes';
import styles from './button.scss';

const CustomButton = ({
    testId,
    className,
    theme,
    outlined,
    disabled,
    loading,
    ...props
}) => (
    <Button
        testId={testId}
        className={classnames(
            className,
            styles[theme],
            {
                [styles.outlined]: outlined,
                [styles.disabled]: disabled,
                [styles.loading]: loading,
            },
        )}
        theme={theme}
        disabled={disabled}
        outlined={outlined}
        isLoading={loading}
        {...props}
    />
);

CustomButton.propTypes = {
    testId: PropTypes.string,
    className: PropTypes.string,
    theme: themeType,
    outlined: PropTypes.bool,
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
};

CustomButton.defaultProps = {
    testId: undefined,
    className: '',
    theme: 'primary',
    outlined: false,
    disabled: false,
    loading: false,
};

export default CustomButton;
