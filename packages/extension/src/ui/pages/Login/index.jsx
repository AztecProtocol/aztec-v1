import React, { Component } from 'react';

import {
    Block, Button, Text,
} from '@aztec/guacamole-ui';

const Step1 = () => (
    <Block
        background="white"
        stretch
        padding="xl"
        align="center"
    >
        <Block padding="l xl">
            <Text text="Create your privacy keys" weight="semibold" color="primary" size="xl" />
        </Block>

        <Block padding="l xl">
            <Text text="AZTEC creates a set of privacy keys that are used to keep your assets private. These are stored in encrypted form inside the extension." weight="light" color="label" size="m" />
            <br />
            <br />
            <br />
            <Text text="We never have access to your privacy keys. Your privacy keys do not control the spending of assets / tokens." color="label" size="m" />
            <br />
            <br />
            <br />
            <Text text="These keys are used to decrypt your balance and construct the Zero-Knowledge proofs needed to interact with AZTEC assets, while keeping your balances private." color="label" weight="light" size="m" />
        </Block>
        <Block padding="l l l 0">
            <Button text="Create Keys" />
            <Text text="Restore from seed phrase" color="label" weight="light" size="xxs" />
        </Block>
    </Block>
);

export default Step1;
