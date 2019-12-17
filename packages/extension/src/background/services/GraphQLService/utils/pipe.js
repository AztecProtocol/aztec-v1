import asyncForEach from '~/utils/asyncForEach';
import {
    unknownError,
} from '~/utils/error';
import errorResponse from './errorResponse';

/*
 * special pipe function that
 *   - deals with graphQL's arguments(parent, args, ctx, info)
 *   - keeps {parent}, {args} and {info} intact
 *   - concat each function call's result and pass them down through {ctx}
 *   - stops piping when catching an error
 */
export default function pipe(funcs) {
    return async (parent, args, ctx = {}, info) => {
        let accumCtx = ctx;
        let result = null;
        let error = null;
        await asyncForEach(funcs, async (func) => {
            if (error) return;

            try {
                result = await func(parent, args, accumCtx, info);
                if (result
                    && result.error
                ) {
                    error = result;
                } else {
                    accumCtx = {
                        ...accumCtx,
                        ...result,
                    };
                }
            } catch (e) {
                if (typeof e !== 'object') {
                    error = unknownError(e);
                } else if (e instanceof Error) {
                    error = unknownError(e.message, e);
                } else {
                    error = e;
                }
            }
        });

        if (error) {
            return errorResponse(error);
        }

        return result;
    };
}
