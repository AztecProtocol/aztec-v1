import React, { Component } from 'react';

import {
    Block,
    Button,
    Text,
    TextButton,
    FlexBox,
} from '@aztec/guacamole-ui';

const Step1 = ({ onClick, restoreClick,  }) => (
    <Block
        background="white"
        stretch
        padding="m"
        align="center"
    >
        <Block padding="0 xl">
            <Text
                text="Register Extension"
                weight="semibold"
                color="primary"
                size="l"
            />
        </Block>

        <Block padding="0 xl">
            <br />
            <br />
            <Text
                text="AZTEC creates a set of privacy keys that are used to keep your assets private. These are stored in an encrypted vault inside the extension."
                weight="light"
                color="label"
                size="s"
            />
            <br />
            <br />
            <br />
            <Text
                text="We never have access to your privacy keys and they do not control the spending of assets / tokens."
                color="label"
                size="s"
                weight="semibold"
            />
            <br />
            <br />
            <br />
            <Text
                text="Your keys are used to decrypt AZTEC balances and construct the Zero-Knowledge proofs required to interact with AZTEC assets."
                color="label"
                weight="light"
                size="s"
            />
        </Block>
        <br />
        <br />
        <FlexBox padding="l l 0 xl" direction="column" align="center">
            <Button text="Create Keys" onClick={onClick} />
            <br />
            <TextButton text="Restore from seed phrase" color="label" weight="light" size="xxs" onClick={restoreClick} />
        </FlexBox>
    </Block>
);

export default Step1;
