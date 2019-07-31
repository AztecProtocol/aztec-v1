import React, { Component } from 'react';

import {
    Block, Button, Text,
} from '@aztec/guacamole-ui';

const Step2 = ({ seedPhrase, onClick }) => (
    <Block
        background="white"
        stretch
        padding="xl"
        align="center"
    >
        <Block padding="l xl">
            <Text text="Backup your seed phrase" weight="semibold" color="primary" size="l" />
        </Block>

        <Block padding="l xl" background="primary" borderRadius="s">
            <Text text={seedPhrase} color="white" />
        </Block>
        <Block padding="l l l 0">
            <Button text="I have backed up my seed phrase" onClick={onClick} />
        </Block>
    </Block>
);

export default Step2;
