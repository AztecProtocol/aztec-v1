const port = {
    onMessage: {
        addListener: () => {},
    },
    postMessage: (...args) => console.log('postMessage', args),
};

export default {
    connect: (...args) => {
        console.log('connect', args);
        return port;
    },
};
