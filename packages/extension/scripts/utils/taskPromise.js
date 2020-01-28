const isPromise = fn => typeof fn.then === 'function';

export default function taskPromise(task) {
    if (isPromise(task)) {
        return task;
    }

    return new Promise((resolve, reject) => {
        task({
            onClose: resolve,
            onError: reject,
        });
    });
}
