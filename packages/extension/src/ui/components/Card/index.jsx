import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import styles from './card.scss';

const Card = ({
    className,
    contentClassName,
    content,
    contentStub,
    stubRatio,
    orientation,
    layer,
}) => {
    const isHorizontal = orientation === 'horizontal';
    const wrapperClassName = classnames(
        className,
        styles.card,
        {
            [styles['card-h']]: isHorizontal,
            [styles['card-v']]: !isHorizontal,
            [styles.modal]: layer > 1,
        },
    );

    const contentStyles = {};
    const stubStyles = {};
    if (isHorizontal && stubRatio) {
        contentStyles.width = `${100 - stubRatio}%`;
        stubStyles.width = `${stubRatio}%`;
    }

    return (
        <div className={wrapperClassName}>
            <div
                className={classnames(
                    contentClassName,
                    styles.content,
                )}
                style={contentStyles}
            >
                {content}
                <div className={styles[isHorizontal ? 'deco-right' : 'deco-bottom']}>
                    <span className={styles[isHorizontal ? 'spot-top' : 'spot-left']} />
                    <span className={styles[isHorizontal ? 'spot-bottom' : 'spot-right']} />
                </div>
            </div>
            <div
                className={styles.stub}
                style={stubStyles}
            >
                <div className={styles[isHorizontal ? 'deco-left' : 'deco-top']}>
                    <span className={styles[isHorizontal ? 'spot-top' : 'spot-left']} />
                    <span className={styles[isHorizontal ? 'spot-bottom' : 'spot-right']} />
                </div>
                {contentStub}
            </div>
        </div>
    );
};

Card.propTypes = {
    className: PropTypes.string,
    orientation: PropTypes.oneOf(['horizontal', 'vertical']),
    contentClassName: PropTypes.string,
    content: PropTypes.node.isRequired,
    contentStub: PropTypes.node.isRequired,
    stubRatio: PropTypes.number,
    layer: PropTypes.number,
};

Card.defaultProps = {
    className: '',
    contentClassName: '',
    orientation: 'vertical',
    stubRatio: 0,
    layer: 1,
};

export default Card;
