import asyncForEach from './asyncForEach';

export default async function asyncPipe(funcs) {
    return (...args) => {
        let error = null;
        let result = null;
        asyncForEach(funcs, async (func) => {
            if (error) return;

            try {
                result = await func(...args);
            } catch (e) {
                error = {
                    message: e,
                };
            }
        });

        return error
            ? { error }
            : result;
    };
}
