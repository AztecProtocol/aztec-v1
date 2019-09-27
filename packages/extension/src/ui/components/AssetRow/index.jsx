import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    FlexBox,
    Text,
} from '@aztec/guacamole-ui';
import {
    avatarSizesMap,
    fontSizeKeys,
    textColorNames,
    defaultLabelColorName,
} from '~ui/styles/guacamole-vars';
import {
    name,
    icon,
} from '~ui/utils/asset';
import formatAddress from '~ui/utils/formatAddress';
import ProfileIcon from '~ui/components/ProfileIcon';
import {
    spacingMapping,
} from '~ui/components/AddressRow';

const AssetRow = ({
    className,
    size,
    textSize,
    code,
    address,
    prefixLength,
    suffixLength,
    color,
}) => (
    <FlexBox
        className={className}
        valign="center"
        nowrap
    >
        <ProfileIcon
            src={icon(code)}
            size={size}
        />
        <Block left={spacingMapping[size]}>
            <FlexBox valign="center" nowrap>
                <Text
                    text={name(code)}
                    size={textSize || size}
                    color={color}
                />
                <Block left="xxs">
                    <Text
                        className="text-code"
                        text={`(${formatAddress(address, prefixLength, suffixLength)})`}
                        size={textSize || size}
                        color={color}
                    />
                </Block>
            </FlexBox>
        </Block>
    </FlexBox>
);

AssetRow.propTypes = {
    className: PropTypes.string,
    size: PropTypes.oneOf(Object.keys(avatarSizesMap)),
    textSize: PropTypes.oneOf(['', 'inherit', ...fontSizeKeys]),
    code: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    prefixLength: PropTypes.number,
    suffixLength: PropTypes.number,
    color: PropTypes.oneOf(textColorNames),
};

AssetRow.defaultProps = {
    className: '',
    size: 's',
    textSize: '',
    prefixLength: 6,
    suffixLength: 4,
    color: defaultLabelColorName,
};

export default AssetRow;
