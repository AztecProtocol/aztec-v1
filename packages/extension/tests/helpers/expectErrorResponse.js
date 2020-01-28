const triggerAsyncCallback = async (cb) => {
    let response;
    try {
        response = await cb();
    } catch (error) {
        response = error;
    }

    return response;
};

const triggerCallback = (cb) => {
    let response;
    try {
        response = cb();
    } catch (error) {
        response = error;
    }

    return response;
};

const isAsyncCallback = cb => cb instanceof Promise
    || cb.constructor.name === 'AsyncFunction';

const validateErrorResponse = (response, key) => {
    expect(Object.keys(response)).toEqual(['error']);
    expect(response.error.key).toBe(key);

    const {
        error,
    } = response || {};

    return error.response;
};

export default function expectErrorResponse(cb) {
    const asyncToBe = async (key) => {
        const response = await triggerAsyncCallback(cb);
        return validateErrorResponse(response, key);
    };
    const toBe = (key) => {
        const response = triggerCallback(cb);
        return validateErrorResponse(response, key);
    };

    return {
        toBe: isAsyncCallback(cb) ? asyncToBe : toBe,
    };
}
