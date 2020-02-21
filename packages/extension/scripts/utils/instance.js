import {
    spawn,
    exec,
} from 'child_process';
import {
    log,
    successLog,
    errorLog,
} from './log';

const childProcessHandler = (childProcess, {
    shouldStart,
    handleClear,
    onStart,
    onReceiveOutput,
    onReceiveErrorOutput,
    onError,
    onClose,
    handleStderrAsNormalOutput,
}) => {
    let hasStarted = false;
    let onStartCallbacks = [];
    let stashedOutputs = [];
    let stashedErrors = [];

    const registerOnStartCallbacks = (cb) => {
        if (Array.isArray(cb)) {
            onStartCallbacks = cb;
        } else {
            onStartCallbacks.push(cb);
        }

        return childProcess;
    };

    const chainNextInstance = (nextInstance) => {
        if (!nextInstance) return;
        if (typeof nextInstance.next !== 'function') {
            errorLog("'next' can only be called on instance.");
            return;
        }
        nextInstance.next([...onStartCallbacks]);
        onStartCallbacks = [];
        stashedOutputs = null;
        stashedErrors = null;
    };

    const triggerNext = async (...params) => {
        const cb = onStartCallbacks.shift();
        if (!cb) {
            errorLog("'next' is not a function.");
            return;
        }
        const nextInstance = params.length > 0
            ? await cb(...params)
            : await cb(onStart && onStart());

        if (onStartCallbacks.length > 0) {
            chainNextInstance(nextInstance);
        }
    };

    if (!('next' in childProcess)) {
        childProcess.next = registerOnStartCallbacks; // eslint-disable-line no-param-reassign
    } else {
        errorLog("'next' is a property of child process.");
    }

    const hasNext = () => onStartCallbacks.length > 0;

    if (handleClear) {
        if (!('clear' in childProcess)) {
            childProcess.clear = handleClear; // eslint-disable-line no-param-reassign
        } else {
            errorLog("'next' is a property of child process.");
        }
    }

    const handleNormalOtput = (data) => {
        const output = data.toString('utf8');
        if (!hasStarted && shouldStart) {
            const onStartMessage = shouldStart(output);
            if (onStartMessage) {
                hasStarted = true;
                successLog(onStartMessage === true ? output : onStartMessage);
                if (hasNext()) {
                    triggerNext();
                } else if (onStart) {
                    onStart();
                }
                return;
            }
        }

        if (!shouldStart && hasNext()) {
            stashedOutputs.push(output);
        }
        if (onReceiveOutput) {
            onReceiveOutput(output);
        } else {
            // process.stdout.write(output);
        }
    };

    childProcess.stdout.on('data', handleNormalOtput);

    childProcess.stderr.on('data', (data) => {
        if (handleStderrAsNormalOutput) {
            handleNormalOtput(data);
            return;
        }

        const output = data.toString('utf8');
        if (!shouldStart && hasNext()) {
            stashedErrors.push(output);
        }
        if (onReceiveErrorOutput) {
            onReceiveErrorOutput(output);
        } else {
            // log(`stderr:\n ${output}`);
        }
    });

    childProcess.on('error', (error) => {
        const output = error.toString('utf8');
        if (onError) {
            onError(output);
        } else {
            errorLog(output);
        }
    });

    childProcess.on('close', (code) => {
        if (!shouldStart && hasNext()) {
            triggerNext(stashedOutputs.join(''), stashedErrors.join(''));
        } else if (onClose) {
            onClose(code);
        } else if (code !== 0) {
            log(`Child process exited with code ${code}`);
        }
    });

    return childProcess;
};

export default function instance(...args) {
    let command;
    let params;
    let options;
    let childProcess;
    if (args.length === 1
        || (args.length === 2 && !Array.isArray(args[1]))
    ) {
        [command, options] = args;
        errorLog(command);
        childProcess = exec(command);
    } else {
        [command, params, options] = args;
        const {
            windowsVerbatimArguments,
        } = options;
        errorLog(command, params);
        childProcess = spawn(
            command,
            params,
            {
                windowsVerbatimArguments,
            },
        );
    }

    const {
        shouldStart,
        handleClear,
        onStart,
        onReceiveOutput,
        onReceiveErrorOutput,
        onError,
        onClose,
        handleStderrAsNormalOutput,
    } = options || {};

    return childProcessHandler(
        childProcess,
        {
            shouldStart,
            handleClear,
            onStart,
            onReceiveOutput,
            onReceiveErrorOutput,
            onError,
            onClose,
            handleStderrAsNormalOutput,
        },
    );
}
