import browser from 'webextension-polyfill';
import { Subject } from 'rxjs';
import ApolloClient from 'apollo-client';

import { SchemaLink } from 'apollo-link-schema';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { makeExecutableSchema } from 'graphql-tools';
import {
    actionEvent,
    sendTransactionEvent,
} from '~config/event';

import { randomId } from '~utils/random';
import filterStream from '~utils/filterStream';
import typeDefs from '~background/services/GraphQLService/typeDefs/ui';
import resolvers from '~background/services/GraphQLService/resolvers/ui';
import RegisterExtensionMutation from '../../mutations/RegisterExtension';
import RegisterAccountMutation from '../../mutations/RegisterAccount';
import ApproveDomainMutatuon from '../../mutations/ApproveDomain';


const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
});

const apollo = new ApolloClient({
    link: new SchemaLink({ schema }),
    cache: new InMemoryCache({
        addTypename: false,
    }),
    defaultOptions: {
        query: {
            fetchPolicy: 'no-cache',
        },
        watchQuery: {
            fetchPolicy: 'no-cache',
        },
    },
    connectToDevTools: true,
});

class ExtensionApi {
    constructor() {
        this.clientId = randomId();
        this.backgroundPort = browser.runtime.connect({
            name: this.clientId,
        });

        this.backgroundSubject = new Subject();
        this.background$ = this.backgroundSubject.asObservable();
        // this.background$.pipe(
        // ).subscribe();

        this.backgroundPort.onMessage.addListener((msg) => {
            this.backgroundSubject.next(msg);
        });

        this.auth = {
            createKeyVault: async ({
                seedPhrase,
                address,
                password = 'test',
                salt = 'salty',
                domain = window.location.origin,
            }) => {
                const response = await apollo.mutate({
                    mutation: RegisterExtensionMutation,
                    variables: {
                        seedPhrase,
                        address,
                        salt,
                        password,
                        domain,
                    },
                });
                const {
                    data: {
                        registerExtension: {
                            account,
                        },
                    },
                } = response;
                return account;
            },
            linkAccountToMetaMask: async ({
                requestId,
                account,
                ...rest
            }) => {
                this.backgroundPort.postMessage({
                    type: actionEvent,
                    requestId,
                    data: {
                        action: 'metamask.register.extension',
                        response: {
                            ...account,
                        },
                    },
                    ...rest,
                });

                return filterStream('ACTION_RESPONSE', requestId, this.background$);
            },
            sendRegisterTransaction: async ({
                params: {
                    address,
                    linkedPublicKey,
                    signature,
                },
                requestId,
                clientId,
            }) => {
                this.backgroundPort.postMessage({
                    type: sendTransactionEvent,
                    requestId,
                    clientId,
                    data: {
                        method: 'registerAZTECExtension',
                        contract: 'AZTECAccountRegistry',
                        params: [
                            address,
                            linkedPublicKey,
                            signature,
                        ],
                    },
                });

                const response = await filterStream('ACTION_RESPONSE', requestId, this.background$);
                return response;
            },
            registerAccount: async ({
                address,
                signature,
                linkedPublicKey,
                registeredAt = Date.now(),
                domain = window.location.origin,
            }) => {
                await apollo.mutate({
                    mutation: RegisterAccountMutation,
                    variables: {
                        address,
                        signature,
                        linkedPublicKey,
                        domain,
                        registeredAt,
                    },

                });
            },
            approveDomain: async ({
                domain,
                address,
            }) => {
                await apollo.mutate({
                    mutation: ApproveDomainMutatuon,
                    variables: {
                        domain,
                        address,
                    },
                });
            },

        };


        this.prove = {
            // sendTransaction,
            signNotes: async ({
                notes,
                spender,
            }) => {
                this.backgroundPort.postMessage({
                    type: actionEvent,
                    requestId,
                    data: {
                        action: 'metamask.ace.publicApprove',
                        response: {
                            notes,
                            spender,
                            status,
                        },
                    },
                    ...rest,
                });

                return filterStream('ACTION_RESPONSE', requestId, this.background$);
            },
            approveERC20: async ({
                amount,
                tokenAddress,
                aceAddress,
                requestId,
                ...rest
            }) => {
                // we only call this if the user is sending the proof
                this.backgroundPort.postMessage({
                    type: actionEvent,
                    requestId,
                    data: {
                        action: 'metamask.ace.publicApprove',
                        response: {
                            amount,
                            tokenAddress,
                            aceAddress,
                        },
                    },
                    ...rest,
                });

                return filterStream('ACTION_RESPONSE', requestId, this.background$);
            },
            returnToClient: async () => {

            },
        };
    }
}

export default new ExtensionApi();
