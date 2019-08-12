import pipe from '../utils/pipe';
import validateExtension from '../validators/validateExtension';
import validateAccount from '../validators/validateAccount';
import validateSession from '../validators/validateSession';
import validateDomainAccess from '../validators/validateDomainAccess';

export default function ensureEntityPermission(func) {
    return pipe([
        validateExtension,
        validateSession,
        validateAccount,
        validateDomainAccess,
        func,
    ]);
}
