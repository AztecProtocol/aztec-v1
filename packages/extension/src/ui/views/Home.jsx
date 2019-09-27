import React from 'react';
import {
    FlexBox,
    Block,
    Text,
} from '@aztec/guacamole-ui';
import Popup from '~ui/components/Popup';
import Logo from '~ui/components/Logo';

const Home = () => (
    <Popup>
        <FlexBox
            direction="column"
            valign="center"
            align="center"
            stretch
        >
            <Block bottom="l">
                <Logo spin />
            </Block>
            <Block top="xxl">
                <Text
                    text="hiding your balances..."
                    size="xs"
                    color="white-light"
                />
            </Block>
        </FlexBox>
    </Popup>
);

export default Home;
