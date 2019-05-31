import graphConfig from '../../config/graphNode';
import {
    errorLog,
} from '../utils/log';
import instance from '../utils/instance';
import getNetwork from '../utils/getNetwork';
import {
    manifestPath,
} from '../utils/path';
import handleErrorOutputAsNormal from '../utils/handleErrorOutputAsNormal';
import {
    getProjectName,
} from '../utils/graph';

export default function deploy({
    onError,
    onClose,
}) {
    const network = getNetwork();
    const {
        ipfs,
        node,
    } = graphConfig.networks[network] || {};
    if (!node || !ipfs) {
        if (!node) {
            errorLog(`node url is not defined for network '${network}'`);
        }
        if (!ipfs) {
            errorLog(`ipfs url is not defined for network '${network}'`);
        }

        if (onClose) {
            onClose();
        }

        return;
    }

    const handleReceiveOutput = (output) => {
        if (output.includes('✖ Failed to')) {
            errorLog(output);
            if (onError) {
                onError();
            }
        } else {
            handleErrorOutputAsNormal(output);
        }
    };

    const projectName = getProjectName();

    instance(
        `./node_modules/.bin/graph deploy ${projectName} ${manifestPath} --debug --ipfs ${ipfs} --node ${node}`,
        {
            onReceiveErrorOutput: handleReceiveOutput,
            onError,
            onClose,
        },
    );
}
