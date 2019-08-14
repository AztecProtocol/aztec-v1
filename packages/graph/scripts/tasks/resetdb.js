import graphNodeConfig from '../../config/graphNode';
import getNetwork from '../utils/getNetwork';
import instance from '../utils/instance';
import {
    log,
    successLog,
    errorLog,
} from '../utils/log';

export default function resetdb({
    onError,
    onClose,
} = {}) {
    const triggerFetalError = () => {
        if (onError) {
            onError();
        } else if (onClose) {
            onClose();
        }
    };

    const network = getNetwork();
    const {
        name,
        user,
    } = graphNodeConfig.databases[network] || {};
    if (!name) {
        errorLog(
            'Database config not found',
            `Database info for network '${network}' is not defined in config/graphNode.`,
        );
        triggerFetalError();
        return;
    }

    let containerId;

    instance('docker -v')
        .next((data) => {
            if (!data) {
                errorLog('Docker is not installed.');
                triggerFetalError();
                return null;
            }

            return instance('docker ps -aqf "name=graph-node"');
        })
        .next((data) => {
            const graphNodeContainerId = data.replace('\n', '');
            if (!graphNodeContainerId) {
                if (onClose) {
                    onClose();
                }
                return null;
            }

            return instance(`docker stop ${graphNodeContainerId}`);
        })
        .next(() => instance('docker ps -aqf "name=postgres"'))
        .next((data) => {
            containerId = data.replace('\n', '');
            if (!containerId) {
                log('No postgres docker container.');
                if (onClose) {
                    onClose();
                }
                return null;
            }

            return instance('docker-compose up -d postgres');
        })
        .next(() => instance(`docker exec ${containerId} dropdb -U ${user} ${name}`))
        .next((data, error) => {
            if (!error) {
                log(data || `Successfully dropped database '${name}'.`);
            } else if (error.includes('does not exist')) {
                log(`No database named '${name}'.`);
            } else {
                errorLog('error', error);
                triggerFetalError();
                return null;
            }

            return instance(
                `docker exec ${containerId} createdb -U ${user} ${name}`,
            );
        })
        .next((data, error) => {
            if (error) {
                errorLog(`Cannot create database '${name}'.`, error);
                triggerFetalError();
                return;
            }

            successLog(`Successfully created new database '${name}'.`);

            if (onClose) {
                onClose();
            }
        });
}
