import pipe from '../utils/pipe';
import validateExtension from '../validators/validateExtension';
import validateAccount from '../validators/validateAccount';
import validateSession from '../validators/validateSession';
import validateDomain from '../validators/validateDomain';
import validateDomainAccess from '../validators/validateDomainAccess';

export default function ensureEntityPermission(func) {
    return pipe([
        validateExtension,
        validateAccount,
        validateSession,
        validateDomain,
        validateDomainAccess,
        func,
    ]);
}
