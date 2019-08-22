const triggerCallback = async (cb) => {
    let response;
    try {
        response = await cb();
    } catch (error) {
        response = error;
    }

    return response;
};

export default function expectErrorResponse(cb) {
    return {
        toBe: async (key) => {
            const response = await triggerCallback(cb);
            expect(Object.keys(response)).toEqual(['error']);
            expect(response.error.key).toBe(key);

            const {
                error,
            } = response || {};

            return error.response;
        },
    };
}
