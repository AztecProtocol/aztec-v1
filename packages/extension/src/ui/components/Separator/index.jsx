import React from 'react';
import PropTypes from 'prop-types';
import {
    Text,
} from '@aztec/guacamole-ui';
import styles from './separator.scss';

const Separator = ({
    title,
}) => (
    <div className={styles.separator}>
        <div className={styles['line-left']} />
        <div className="flex-fixed">
            <Text
                text={title}
                size="s"
            />
        </div>
        <div className={styles['line-right']} />
    </div>
);

Separator.propTypes = {
    title: PropTypes.string.isRequired,
};

export default Separator;
