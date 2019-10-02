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
    themeType,
} from '~ui/config/propTypes';
import i18n from '~ui/helpers/i18n';
import formatAddress from '~ui/utils/formatAddress';
import ProfileIcon from '~ui/components/ProfileIcon';
import {
    spacingMapping,
} from '~ui/components/AddressRow';

const AssetRow = ({
    className,
    theme,
    size,
    textSize,
    code,
    icon,
    address,
    prefixLength,
    suffixLength,
    color,
}) => {
    const name = i18n.token(code);
    const addressHint = [
        name ? '(' : '',
        formatAddress(address, prefixLength, suffixLength),
        name ? ')' : '',
    ].join('');

    return (
        <FlexBox
            className={className}
            valign="center"
            nowrap
        >
            <ProfileIcon
                theme={theme}
                type="asset"
                src={icon}
                size={size}
            />
            <Block left={spacingMapping[size]}>
                <FlexBox valign="center" nowrap>
                    <Text
                        text={name}
                        size={textSize || size}
                        color={color}
                    />
                    <Block left="xxs">
                        <Text
                            className="text-code"
                            text={addressHint}
                            size={textSize || size}
                            color={color}
                        />
                    </Block>
                </FlexBox>
            </Block>
        </FlexBox>
    );
};

AssetRow.propTypes = {
    className: PropTypes.string,
    theme: themeType,
    size: PropTypes.oneOf(Object.keys(avatarSizesMap)),
    textSize: PropTypes.oneOf(['', 'inherit', ...fontSizeKeys]),
    code: PropTypes.string,
    icon: PropTypes.string,
    address: PropTypes.string.isRequired,
    prefixLength: PropTypes.number,
    suffixLength: PropTypes.number,
    color: PropTypes.oneOf(textColorNames),
};

AssetRow.defaultProps = {
    className: '',
    theme: 'white',
    size: 's',
    textSize: '',
    code: '',
    icon: '',
    prefixLength: 6,
    suffixLength: 4,
    color: defaultLabelColorName,
};

export default AssetRow;
