import taskPromise from './taskPromise';
import asyncForEach from './asyncForEach';

export const log = (...messages) => ({
    onClose,
}) => {
    console.log(...messages); // eslint-disable-line no-console
    onClose();
};

export default async function pipeTasks(
    tasks,
    {
        onError,
        onClose,
        breakOnError = true,
    } = {},
) {
    let shouldBreak = false;
    let firstError;
    await asyncForEach(tasks, async (task, i) => {
        if (shouldBreak) return;
        await taskPromise(tasks[i])
            .catch((error) => {
                if (!firstError) {
                    firstError = error || true;
                }
                if (breakOnError) {
                    shouldBreak = true;
                }
                if (onError) {
                    onError(error);
                }
            });
    });

    if (onClose) {
        onClose(firstError);
    }
}
