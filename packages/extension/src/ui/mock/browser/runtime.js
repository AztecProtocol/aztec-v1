const port = () => {
    let callback;
    return {
        onMessage: {
            addListener: (cb) => {
                callback = cb;
            },
        },
        postMessage: (args) => {
            console.log('postMessage', args, callback);
            if (callback) {
                callback(args);
            }
        },
    };
};

export default {
    connect: (...args) => {
        console.log('connect', args);
        return port();
    },
};
