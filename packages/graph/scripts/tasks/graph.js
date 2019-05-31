import {
    args,
} from '../utils/cmd';
import pipeTasks from '../utils/pipeTasks';
import {
    errorLog,
} from '../utils/log';
import codegen from './codegen';
import create from './create';
import deploy from './deploy';

const commandMapping = {
    codegen,
    create,
    deploy,
};

export default function graph({
    onError,
    onClose,
} = {}) {
    const taskName = args(-1);
    const command = args(0);
    if (taskName === 'graph' && command) {
        if (!commandMapping[command]) {
            const available = Object.keys(commandMapping);
            errorLog(`Command '${command}' is not valid. Available commands: [${available.join(', ')}]`);

            if (onClose) {
                onClose();
            }
        } else {
            commandMapping[command]({
                onError,
                onClose,
            });
        }
        return;
    }

    pipeTasks(
        [
            codegen,
            create,
            deploy,
        ],
        {
            onError,
            onClose,
        },
    );
}
