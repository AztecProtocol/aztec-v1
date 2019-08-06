import graphConfig from '../../config/graphNode';
import getNetwork from './getNetwork';
import {
    errorLog,
} from './log';

const network = getNetwork();

const getProjectName = () => {
    const {
        name,
        githubUser,
    } = graphConfig;

    return `${githubUser}/${name}`;
};

const validProtocols = ['http', 'ws'];
const getUrlConfig = (protocol) => {
    if (validProtocols.indexOf(protocol) < 0) {
        errorLog(`Protocol ${protocol} is not valid.`);
        return null;
    }

    const config = (graphConfig.networks[network] || {})[protocol];

    return config;
};

const getUrl = (protocol) => {
    const config = getUrlConfig(protocol);
    if (!config) {
        errorLog(
            'Url not defined',
            '  File: config/graphNode',
            `  Protocol: ${protocol}`,
            `  Network: ${network}`,
        );
        return '';
    }

    const {
        host,
        path,
        port,
    } = config;

    const url = [
        host || 'http://localhost',
        port ? `:${port}` : '',
        path && !path.startsWith('/') ? `/${path}` : path || '',
    ].join('');

    const name = getProjectName();

    return url.endsWith('/') ? `${url}${name}` : `${url}/${name}`;
};

const getHttpUrl = () => getUrl('http');

const getWebSocketUrl = () => getUrl('ws');

export {
    getProjectName,
    getUrlConfig,
    getHttpUrl,
    getWebSocketUrl,
};
