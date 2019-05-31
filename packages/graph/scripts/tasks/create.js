import graphConfig from '../../config/graphNode';
import {
    errorLog,
} from '../utils/log';
import instance from '../utils/instance';
import getNetwork from '../utils/getNetwork';
import handleErrorOutputAsNormal from '../utils/handleErrorOutputAsNormal';
import {
    getProjectName,
} from '../utils/graph';

export default function create({
    onError,
    onClose,
}) {
    const network = getNetwork();

    const {
        node,
    } = graphConfig.networks[network] || {};
    if (!node) {
        errorLog(`Node url is not defined for network '${network}'`);

        if (onClose) {
            onClose();
        }

        return;
    }

    const projectName = getProjectName();

    instance(
        `./node_modules/.bin/graph create ${projectName} --node ${node}`,
        {
            onReceiveErrorOutput: handleErrorOutputAsNormal,
            onError,
            onClose,
        },
    );
}
