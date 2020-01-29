import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
    Text,
} from '@aztec/guacamole-ui';
import {
    themeType,
} from '~/ui/config/propTypes';
import styles from './separator.scss';

const Separator = ({
    theme,
    title,
}) => (
    <div className={classnames(styles.separator, styles[`theme-${theme}`])}>
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
    theme: themeType,
    title: PropTypes.string.isRequired,
};

Separator.defaultProps = {
    theme: 'primary',
};

export default Separator;
