import React, {
    useState,
} from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
    TextInput,
    Icon,
} from '@aztec/guacamole-ui';
import ProfileSvg from '~ui/components/ProfileSvg';
import {
    baseColors,
} from '~ui/components/ProfileSvg/utils/generateSvgProps';

const DemoAddress = () => {
    const [demoAddress, updateDemoAddress] = useState('');
    return (
        <FlexBox valign="center">
            <Block padding="m">
                <ProfileSvg
                    address={demoAddress}
                    size="l"
                />
            </Block>
            <Block padding="m">
                <Icon
                    name="chevron_left"
                    color="label"
                />
            </Block>
            <Block padding="m">
                <TextInput
                    value={demoAddress}
                    placeholder="enter anything..."
                    onChange={updateDemoAddress}
                    size="xs"
                    inline
                />
            </Block>
        </FlexBox>
    );
};

const Icons = ({
    addresses,
}) => (
    <Block padding="m l">
        <DemoAddress />
        <Block padding="m 0">
            {addresses.map(addr => (
                <Block
                    key={addr}
                    padding="m"
                    inline
                >
                    <ProfileSvg
                        address={addr}
                        size="l"
                    />
                </Block>
            ))}
        </Block>
        <Block padding="m">
            {baseColors.map(colorCode => (
                <Block
                    key={colorCode}
                    inline
                >
                    <Block
                        padding="m"
                        style={{ background: colorCode }}
                    />
                </Block>
            ))}
        </Block>
    </Block>
);

Icons.propTypes = {
    addresses: PropTypes.arrayOf(PropTypes.string),
};

Icons.defaultProps = {
    addresses: [],
};

export default Icons;
