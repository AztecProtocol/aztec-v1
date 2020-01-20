import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import styles from './browser.scss';

const BrowserWindow = ({
    className,
    children,
}) => (
    <div
        className={classnames(
            className,
            styles.holder,
        )}
    >
        <div className={styles.head}>
            <div className={styles['button-red']} />
            <div className={styles['button-yellow']} />
            <div className={styles['button-green']} />
        </div>
        <div className={styles.body}>
            {children}
        </div>
    </div>
);

BrowserWindow.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node.isRequired,
};

BrowserWindow.defaultProps = {
    className: '',
};

export default BrowserWindow;
