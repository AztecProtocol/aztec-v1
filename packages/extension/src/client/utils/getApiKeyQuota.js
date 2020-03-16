import urls from '~/config/urls';
import {
    warnLog,
} from '~/utils/log';
import {
    formatStrPattern,
} from '~/utils/format';
import Web3Service from '~/client/services/Web3Service';

const urlPattern = urls.apiKeyQuota;

export default async function getApiKeyQuota(apiKey) {
    if (!apiKey) {
        return {
            hasFreeTransactions: false,
        };
    }

    const {
        networkId,
    } = Web3Service;
    const url = formatStrPattern(urlPattern, {
        apiKey,
        networkId,
    });

    let hasFreeTransactions = false;
    try {
        const result = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
        });

        const {
            data: {
                quota,
                origin,
            },
        } = await result.json();
        const currentOrigin = origin.startsWith('http')
            ? window.location.origin
            : window.location.host;
        if (currentOrigin === origin) {
            hasFreeTransactions = quota > 0;
        }
    } catch (e) {
        warnLog('Failed to get apiKey quota.', e);
    }

    return {
        hasFreeTransactions,
    };
}
