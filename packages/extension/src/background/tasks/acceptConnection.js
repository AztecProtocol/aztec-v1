import browser from 'webextension-polyfill';
import gql from 'graphql-tag';
import psl from 'psl';
import {
    errorLog,
} from '~utils/log';
import GraphQLService from '../services/GraphQLService';
import insertVariablesToGql from '../utils/insertVariablesToGql';

export default function acceptConnection() {
    browser.runtime.onMessage.addListener(async (data, sender) => {
        const {
            query,
            mutation,
            variables,
        } = data || {};
        let result;
        if (query) {
            try {
                result = await GraphQLService.query({
                    query: gql(`{${query}}`),
                    variables,
                });
            } catch (error) {
                errorLog('Query data from GraphQL Service failed.', error);
            }
        } else if (mutation) {
            const {
                url,
            } = sender;
            const {
                domain,
            } = psl.parse(url.replace(/^https?:\/\//, '').split('/')[0]);
            const mutationWithDomain = insertVariablesToGql(
                mutation,
                {
                    domain,
                },
            );

            try {
                result = await GraphQLService.mutate({
                    mutation: gql(`mutation {${mutationWithDomain}}`),
                    variables,
                });
            } catch (error) {
                errorLog('Mutate data in GraphQL Service failed.', error);
            }
        }

        return result || {};
    });
}
