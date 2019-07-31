import React, { Component } from 'react';

import {
    Block, Button, Text, TextInput,
} from '@aztec/guacamole-ui';

import { Mutation } from 'react-apollo';
import RegisterExtensionMutation from '../../mutations/RegisterExtension';

class Step3 extends Component {
    state = {
    }

    __updatePassword(value) {
        this.setState({ password: value });
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
                    <Text text="Last step! Encrypt your keys with a password" weight="semibold" color="primary" size="l" />
                </Block>
                <Block padding="l xl">
                    <TextInput type="password" placeholder="Enter password..." onChange={e => this.__updatePassword(e)} />
                </Block>
                <Block padding="l l l 0">

                    <Mutation mutation={RegisterExtensionMutation}>
                        {(mutation, { data }) => (
                            <Button
                                text="Link account to MetaMask"
                                onClick={() => this.props.onClick(mutation, this.state.password)()}
                            />
                        )
                        }

                    </Mutation>
                </Block>
            </Block>

        );
    }
}

export default Step3;
