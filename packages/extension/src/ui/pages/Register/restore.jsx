import React, { Component } from 'react';

import {
    Block, Button, Text, TextInput,
} from '@aztec/guacamole-ui';

import { Mutation } from 'react-apollo';
import RegisterExtensionMutation from '../../mutations/RegisterExtension';

class Restore extends Component {
    state = {

    }

    __updateSeedPhrase(value) {
        this.setState({ seedPhrase: value });
    }

    render() {
        return (
            <Block
                background="white"
                stretch
                padding="xl"
                align="center"
            >
                <Block padding="l xl">
                    <Text text="Recover from seed phrase" weight="semibold" color="primary" size="l" />
                </Block>
                <Block padding="l xl">
                    <TextInput placeholder="Enter seed phrase..." onChange={e => this.__updateSeedPhrase(e)} />
                </Block>
                <Block padding="l l l 0">

                    <Button
                        text="Recover Account"
                        onClick={() => this.props.updateSeedPhrase(this.state.seedPhrase)}
                    />
                </Block>
            </Block>

        );
    }
}

export default Restore;
