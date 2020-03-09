import {
    unknownError,
} from '~/utils/error';
import errorResponse from './errorResponse';

export default function toApiResponse(fn) {
    return async (parent, args, ctx = {}, info) => {
        let result;
        let error;

        try {
            result = await fn(args, ctx, info);
        } catch (e) {
            if (typeof e !== 'object') {
                error = unknownError(e);
            } else if (e instanceof Error) {
                error = unknownError(e.message, e);
            } else {
                error = e;
            }
        }

        if (error) {
            return errorResponse(error);
        }

        return result;
    };
}
