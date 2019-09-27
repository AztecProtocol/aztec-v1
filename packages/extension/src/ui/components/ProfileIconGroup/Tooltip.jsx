import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import styles from './tooltip.scss';

const Tooltip = ({
    items,
    numberOfVisibleItems,
}) => (
    <div className={styles.tooltip}>
        {items.slice(0, numberOfVisibleItems).map((item, i) => (
            <Block
                key={`${item}_${+i}`}
                padding="xxs"
            >
                <Text
                    text={item}
                    size="xxs"
                />
            </Block>
        ))}
        {(items.length > numberOfVisibleItems) && (
            <Block padding="xxs">
                <Text
                    text={i18n.t('and.more.count', items.length - numberOfVisibleItems)}
                    size="xxs"
                    color="white-lighter"
                />
            </Block>
        )}
    </div>
);

Tooltip.propTypes = {
    items: PropTypes.arrayOf(PropTypes.string).isRequired,
    numberOfVisibleItems: PropTypes.number,
};

Tooltip.defaultProps = {
    numberOfVisibleItems: 3,
};

export default Tooltip;
