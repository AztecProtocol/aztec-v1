import {
    terminal,
} from 'terminal-kit';
import dockerInstance from '../instances/dockerInstance';
import {
    log,
    warnLog,
} from '../utils/log';

export default function docker({
    onError,
    onClose,
}) {
    let cp;
    let confirmClose = false;

    const handleClose = () => {
        if (typeof cp.clear === 'function') {
            cp.clear();
        } else {
            cp.kill();
        }
    };

    terminal.grabInput(true);
    terminal.on('key', (key) => {
        switch (key) {
            case 'CTRL_C': {
                if (!confirmClose) {
                    terminal.grabInput(false);
                    confirmClose = true;
                    warnLog('\nGracefully stopping child processes...\n');
                    log('Press ctrl+c again to force exit.');
                    log("(This may cause some problems when running 'yarn start' again.)\n");
                    handleClose();
                } else {
                    process.exit(0);
                }
                break;
            }
            default:
                if (confirmClose) {
                    confirmClose = false;
                }
        }
    });

    cp = dockerInstance({
        onError,
        onClose,
    });
}
