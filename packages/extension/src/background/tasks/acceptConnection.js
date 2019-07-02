import browser from 'webextension-polyfill';
import gql from 'graphql-tag';
import GraphQLService from '../services/GraphQLService';

export default function acceptConnection() {
    browser.runtime.onMessage.addListener(async (data) => {
        const {
            query,
        } = data || {};
        let result;
        if (query) {
            try {
                result = await GraphQLService.query({
                    query: gql(`{${query}}`),
                });
            } catch (error) {
                console.error(error);
            }
        }

        return result;
    });
}
