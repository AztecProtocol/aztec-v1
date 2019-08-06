import fetch from 'node-fetch';
import {
    getHttpUrl,
} from '../../scripts/utils/graph';
import {
    log,
} from '../../scripts/utils/log';
import sleep from '../utils/sleep';

const graphQLServerUrl = getHttpUrl();

const dataNotReady = (data) => {
    if (data === undefined || data === null) {
        return true;
    }

    return Object.keys(data).some((key) => {
        if (data[key] === null) {
            return true;
        }
        return Array.isArray(data[key]) && !data[key].legnth;
    });
};

export default async function Query({
    query,
    variables,
    retry = 3,
}) {
    let queryStr = query.trim();
    if (queryStr && !queryStr.match('^({|query|mutation)')) {
        queryStr = `{${queryStr}}`;
    }

    const response = await fetch(graphQLServerUrl, {
        method: 'POST',
        body: JSON.stringify({
            query: queryStr,
            variables,
        }),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    let data;
    try {
        const json = await response.json();
        let errors;
        ({
            data,
            errors,
        } = json || {});
        if (errors) {
            log(errors);
            throw new Error('Fetch query from GraphQL server failed');
        }
    } catch (error) {
        throw new Error(error);
    }

    if (retry > 0 && dataNotReady(data)) {
        await sleep(1000);

        data = await Query({
            query,
            variables,
            retry: retry - 1,
        });
    }

    return data;
}
