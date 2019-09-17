import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import styles from './ticket.scss';

const Edge = () => (
    <div className={styles.edge}>
        <div className={styles.space} />
        <div className={styles['dot-line']}>
            <span className={styles['spot-left']} />
            <span className={styles['spot-right']} />
        </div>
        <div className={styles.space} />
    </div>
);

const Ticket = ({
    className,
    children,
    header,
    footer,
    height,
}) => {
    const edgeNodes = [];
    for (let i = 0; i < height; i += 1) {
        edgeNodes.push(<Edge key={`edge-${+i}`} />);
    }

    return (
        <div
            className={classnames(
                className,
                styles.ticket,
            )}
        >
            <div className={styles.edges}>
                {edgeNodes}
            </div>
            <div className={styles.content}>
                {!!header && (
                    <div className={styles.header}>
                        {header}
                    </div>
                )}
                {children}
                {!!footer && (
                    <div className={styles.footer}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

Ticket.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
    header: PropTypes.node,
    footer: PropTypes.node,
    height: PropTypes.number,
};

Ticket.defaultProps = {
    className: '',
    children: null,
    header: null,
    footer: null,
    height: 3,
};

export default Ticket;
