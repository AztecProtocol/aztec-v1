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
import ProfileIcon from '~/ui/components/ProfileIcon';
import colorSchemes from '~/ui/components/ProfileIcon/config/colorSchemes';

const DemoAddress = ({ type }) => { // eslint-disable-line react/prop-types
    const [demoAddress, updateDemoAddress] = useState('');
    return (
        <FlexBox valign="center">
            <Block padding="m">
                <ProfileIcon
                    type={type}
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
    type,
    addresses,
    noteHashes,
}) => (
    <Block padding="m l">
        <DemoAddress
            type={type}
        />
        <Block padding="m 0">
            {addresses.length > 0 && addresses.map(addr => (
                <Block
                    key={addr}
                    padding="m"
                    inline
                >
                    <ProfileIcon
                        type={type}
                        address={addr}
                        size="l"
                    />
                </Block>
            ))}
            {noteHashes.length > 0 && noteHashes.map(noteHash => (
                <Block
                    key={noteHash}
                    padding="m"
                    inline
                >
                    <ProfileIcon
                        type={type}
                        noteHash={noteHash}
                        size="l"
                    />
                </Block>
            ))}
        </Block>
        <Block padding="m">
            {colorSchemes[type].map(colorCode => (
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
    type: PropTypes.string,
    addresses: PropTypes.arrayOf(PropTypes.string),
    noteHashes: PropTypes.arrayOf(PropTypes.string),
};

Icons.defaultProps = {
    type: 'user',
    addresses: [],
    noteHashes: [],
};

export default Icons;
