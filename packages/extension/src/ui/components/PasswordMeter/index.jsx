import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
    ProgressBar,
} from '@aztec/guacamole-ui';
import i18n from '~/ui/helpers/i18n';
import evaluatePassword from './utils/evaluatePassword';

const levelStyles = [
    {
        color: 'red',
        textKey: 'account.password.weak',
    },
    {
        color: 'orange',
        textKey: 'account.password.fair',
    },
    {
        color: 'yellow',
        textKey: 'account.password.good',
    },
    {
        color: 'green',
        textKey: 'account.password.strong',
    },
];

const PasswordMeter = ({
    className,
    password,
}) => {
    const {
        score,
        base,
    } = evaluatePassword(password);
    const numberOfLevels = levelStyles.length;
    const scale = Math.ceil(base / numberOfLevels);
    const level = Math.min(
        numberOfLevels - 1,
        Math.floor(score / scale),
    );
    const {
        color,
        textKey,
    } = levelStyles[level];

    return (
        <div className={className}>
            <ProgressBar
                value={Math.min(base, score)}
                base={base}
                activeColor={color}
                rounded
            />
            <Block top="xs">
                <Text
                    text={i18n.t(textKey)}
                    size="xxs"
                    color="label"
                />
            </Block>
        </div>
    );
};

PasswordMeter.propTypes = {
    className: PropTypes.string,
    password: PropTypes.string.isRequired,
};

PasswordMeter.defaultProps = {
    className: '',
};

export default PasswordMeter;
