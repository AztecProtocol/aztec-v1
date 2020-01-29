import React from 'react';
import {
    FlexBox,
    Block,
    Text,
} from '@aztec/guacamole-ui';
import PopupContent from '~/ui/components/PopupContent';
import Logo from '~/ui/components/Logo';

const Home = () => (
    <PopupContent>
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
    </PopupContent>
);

export default Home;
