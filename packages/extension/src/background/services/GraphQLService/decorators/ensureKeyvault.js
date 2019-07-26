import pipe from '../utils/pipe';
import validateExtension from '../validators/validateExtension';
import validateSession from '../validators/validateSession';

export default function ensureKeyvault(func) {
    return pipe([
        validateExtension,
        validateSession,
        func,
    ]);
}
