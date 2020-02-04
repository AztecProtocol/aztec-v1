import urls from '~/config/urls';
import {
    warnLog,
} from '~/utils/log';
import {
    formatStrPattern,
} from '~/utils/format';
import Web3Service from '~/client/services/Web3Service';

const urlPattern = urls.apiKeyQuota;

export default async function getApiKeyApproval(apiKey, data) {
    const {
        networkId,
    } = Web3Service;
    const url = formatStrPattern(urlPattern, {
        apiKey,
        networkId,
    });

    let approvalData = null;
    try {
        const result = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data }),
        });
        ({
            data: {
                approvalData,
            },
        } = await result.json());
    } catch (e) {
        warnLog('Failed to get apiKey approval.', e);
    }

    return {
        approvalData,
    };
}
