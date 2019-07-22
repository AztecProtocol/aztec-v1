import pipe from '../utils/pipe';
import validateAccount from '../validators/validateAccount';
import validateSession from '../validators/validateSession';
import validateDomain from '../validators/validateDomain';
import validateDomainAccess from '../validators/validateDomainAccess';

export default function ensureEntityPermission(func) {
    return pipe([
        validateAccount,
        validateSession,
        validateDomain,
        validateDomainAccess,
        func,
    ]);
}
