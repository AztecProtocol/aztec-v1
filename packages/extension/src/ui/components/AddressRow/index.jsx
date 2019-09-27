import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
    Text,
} from '@aztec/guacamole-ui';
import {
    avatarSizesMap,
    fontSizeKeys,
    textColorNames,
    defaultLabelColorName,
} from '~ui/styles/guacamole-vars';
import formatAddress from '~ui/utils/formatAddress';
import ProfileIcon from '~ui/components/ProfileIcon';

export const spacingMapping = {
    xxs: 's',
    xs: 's',
    s: 'm',
    m: 'm',
    l: 'l',
    xl: 'l',
    xxl: 'l',
};

const AddressRow = ({
    className,
    size,
    textSize,
    address,
    prefixLength,
    suffixLength,
    color,
    inline,
}) => (
    <FlexBox
        className={className}
        valign="center"
        nowrap
    >
        <ProfileIcon
            className="flex-fixed"
            theme="white"
            type="user"
            size={size}
            inline={inline}
        />
        <Block
            className="flex-free-expand"
            left={spacingMapping[size]}
        >
            <Text
                className="text-code"
                text={formatAddress(address, prefixLength, suffixLength)}
                size={textSize || size}
                color={color}
            />
        </Block>
    </FlexBox>
);

AddressRow.propTypes = {
    className: PropTypes.string,
    size: PropTypes.oneOf(Object.keys(avatarSizesMap)),
    textSize: PropTypes.oneOf(['', 'inherit', ...fontSizeKeys]),
    address: PropTypes.string.isRequired,
    prefixLength: PropTypes.number,
    suffixLength: PropTypes.number,
    color: PropTypes.oneOf(textColorNames),
    inline: PropTypes.bool,
};

AddressRow.defaultProps = {
    className: '',
    size: 's',
    textSize: '',
    prefixLength: 6,
    suffixLength: 4,
    color: defaultLabelColorName,
    inline: false,
};

export default AddressRow;
