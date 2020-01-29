import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
} from '@aztec/guacamole-ui';
import i18n from '~/ui/helpers/i18n';

const MoreItems = ({
    className,
    items,
    numberOfVisibleItems,
}) => (
    <div className={className}>
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
            <Block
                padding="xxs"
                align="center"
            >
                <Text
                    text={i18n.t('and.more.count', items.length - numberOfVisibleItems)}
                    size="xxs"
                    color="white-lighter"
                />
            </Block>
        )}
    </div>
);

MoreItems.propTypes = {
    className: PropTypes.string,
    items: PropTypes.arrayOf(PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.element,
    ])).isRequired,
    numberOfVisibleItems: PropTypes.number,
};

MoreItems.defaultProps = {
    className: '',
    numberOfVisibleItems: 3,
};

export default MoreItems;
