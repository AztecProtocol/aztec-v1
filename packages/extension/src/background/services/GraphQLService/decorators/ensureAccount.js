import pipe from '../utils/pipe';
import validateExtension from '../validators/validateExtension';
import validateSession from '../validators/validateSession';
import validateAccount from '../validators/validateAccount';

export default function ensureAccount(func) {
    return pipe([
        validateExtension,
        validateSession,
        validateAccount,
        func,
    ]);
}
