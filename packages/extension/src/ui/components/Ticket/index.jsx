import React from 'react';
import {
    FlexBox,
} from '@aztec/guacamole-ui';
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
    align,
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
                <FlexBox
                    direction="column"
                    align="center"
                    valign={align}
                    expand
                    stretch
                    nowrap
                >
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
                </FlexBox>
            </div>
        </div>
    );
};

Ticket.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
    header: PropTypes.node,
    footer: PropTypes.node,
    align: PropTypes.oneOf([
        'center',
        'flex-start',
        'flex-end',
    ]),
    height: PropTypes.number,
};

Ticket.defaultProps = {
    className: '',
    children: null,
    header: null,
    footer: null,
    align: 'flex-start',
    height: 3,
};

export default Ticket;
