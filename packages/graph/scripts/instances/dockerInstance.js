import instance from '../utils/instance';
import {
    log,
    errorLog,
} from '../utils/log';

const killedSig = '137';

export default function graphNodeDockerInstance({
    onClose,
    onError,
}) {
    const handleReceiveOutput = (output) => {
        if (output.includes('exited with code')) {
            const [, code] = output.match(/exited with code ([0-9]+)/) || [];
            if (code !== killedSig) {
                errorLog(`✖ Graph Node exited with code ${code}`, code);
            }
            if (onError) {
                onError();
            }
            if (onClose) {
                onClose();
            }
        } else if (!output.includes('TokioContention')) {
            process.stdout.write(output);
        }
    };

    const handleClearContainers = ({
        onClear,
    } = {}) => {
        instance('docker ps -qf "name=graph-node"')
            .next((data) => {
                const graphNodeContainerId = data.replace('\n', '');
                if (!graphNodeContainerId) {
                    return null;
                }

                log(`Stopping docker container ${graphNodeContainerId}...`);

                return instance(
                    `docker stop ${graphNodeContainerId}`,
                );
            })
            .next(() => {
                log('Successfully stopped graph-node docker container.');
                if (onClear) {
                    onClear();
                } else if (onClose) {
                    onClose();
                }
            });
    };

    return instance(
        'docker-compose up',
        {
            shouldStart: output => output.includes('Starting GraphQL WebSocket server at'),
            onReceiveOutput: handleReceiveOutput,
            handleClear: handleClearContainers,
            onError,
            onClose,
        },
    );
}
