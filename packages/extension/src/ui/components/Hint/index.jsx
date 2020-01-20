import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
    Text,
} from '@aztec/guacamole-ui';
import styles from './hint.scss';

const Hint = ({
    className,
    text,
    direction,
}) => (
    <div className={classnames(styles.hint, className)}>
        <div className={styles[`arrow-${direction}`]} />
        <Text
            text={text}
            size="xxs"
        />
    </div>
);

Hint.propTypes = {
    className: PropTypes.string,
    text: PropTypes.string.isRequired,
    direction: PropTypes.oneOf([
        'up',
    ]),
};

Hint.defaultProps = {
    className: '',
    direction: 'up',
};

export default Hint;
