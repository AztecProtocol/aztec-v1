import {
    warnLog,
} from '~/utils/log';

export default function isStepAfter(steps, currentStep, targetStep) {
    const currentIdx = steps.findIndex(({
        name,
    }) => name === currentStep);
    if (currentIdx < 0) {
        warnLog(`Cannot find step '${currentStep}'`);
        return false;
    }

    const targetIdx = steps.findIndex(({
        name,
    }) => name === targetStep);
    if (targetIdx < 0) {
        warnLog(`Cannot find step '${targetStep}'`);
        return false;
    }

    return currentIdx > targetIdx;
}
