import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    FlexBox,
    Text,
    Icon,
} from '@aztec/guacamole-ui';
import formatAddress from '~ui/utils/formatAddress';

const AddressRow = ({
    className,
    address,
    iconName,
    iconColor,
    prefixLength,
    suffixLength,
}) => (
    <FlexBox
        className={className}
        nowrap
    >
        <Block
            className="flex-fixed"
            right="s"
        >
            <Icon
                name={iconName}
                color={iconColor}
                size="m"
            />
        </Block>
        <div className="flex-free-expand">
            <Text
                className="text-code"
                text={formatAddress(address, prefixLength, suffixLength)}
                size="xxs"
                color="grey-dark"
                showEllipsis
            />
        </div>
    </FlexBox>
);

AddressRow.propTypes = {
    className: PropTypes.string,
    address: PropTypes.string.isRequired,
    iconName: PropTypes.string,
    iconColor: PropTypes.string,
    prefixLength: PropTypes.number,
    suffixLength: PropTypes.number,
};

AddressRow.defaultProps = {
    className: '',
    iconName: 'person_outline',
    iconColor: 'label',
    prefixLength: 18,
    suffixLength: 6,
};

export default AddressRow;
