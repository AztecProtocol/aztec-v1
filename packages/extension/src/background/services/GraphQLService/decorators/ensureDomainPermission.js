import pipe from '../utils/pipe';
import validateExtension from '../validators/validateExtension';
import validateAccount from '../validators/validateAccount';
import validateSession from '../validators/validateSession';
import validateDomain from '../validators/validateDomain';

export default function ensureDomainPermission(func) {
    return pipe([
        validateExtension,
        validateSession,
        validateAccount,
        validateDomain,
        func,
    ]);
}
