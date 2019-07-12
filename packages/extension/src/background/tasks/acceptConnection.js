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

        const {
            url,
        } = sender;
        const {
            domain,
        } = psl.parse(url.replace(/^https?:\/\//, '').split('/')[0]);

        let type = 'query';
        if (mutation) {
            type = 'mutation';
        }
        // we always want the domain to be from the sender so the user can't fake this
        const graphQuery = insertVariablesToGql(
            mutation || query,
            {
                domain,
            },
        );

        try {
            result = await GraphQLService[type]({
                [type]: gql(`${type} {${graphQuery}}`),
                variables,
            });
            console.log(result);
            return result || {};
        } catch (error) {
            errorLog('Error in GraphQL Service.', error);
            return error;
        }

        return result || {};
    });
}
