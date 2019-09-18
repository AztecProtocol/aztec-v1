import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import {
    Block, Button, Text, TextInput,
} from '@aztec/guacamole-ui'; import { randomId } from '~utils/random';
import {
    actionEvent,
} from '~config/event';
import RegisterExtensionMutation from '../../mutations/RegisterExtension';

class Step3 extends Component {
    state = {}

    updatePassword(value) {
        this.setState({ password: value });
    }

    async linkAccountToMetaMask() {
        // TODO this will change to the requestId stored in the action
        const requestId = randomId();
        console.log(this.props);
        this.props.port.postMessage({
            type: actionEvent,
            clientId: query.clientId,
            requestId: query.requestId,
            data: {
                action: 'metamask.register.extension',
                response: {
                    ...account,
                    address: address(account.address),
                },
                requestId: query.requestId,
            },
        });
        const response = await filterStream('CLIENT_RESPONSE', requestId, this.subject.asObservable());
    }

    sendTransaction() {

    }

    registerAccount() {

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
                    <TextInput type="password" placeholder="Enter password..." onChange={e => this.updatePassword(e)} />
                </Block>
                <Block padding="l l l 0">
                    <Button
                        text="Link account to MetaMask"
                        onClick={() => this.linkAccountToMetaMask()}
                    />
                    <Button
                        text="Send Transaction"
                        onClick={() => this.sendTransaction()}
                    />
                    <Button
                        text="Register Account"
                        onClick={() => this.registerAccount()}
                    />
                    {
                        /*
                         <Mutation mutation={RegisterExtensionMutation}>
                             {(mutation, { data }) => (
                                 <Button
                                     text="Link account to MetaMask"
                                     onClick={() => this.props.onClick(mutation, this.state.password)()}
                                 />
                             )
                             }
                         </Mutation>

                         */

                    }
                </Block>
            </Block>

        );
    }
}

export default Step3;
