import pipe from '../utils/pipe';
import validateExtension from '../validators/validateExtension';
import validateAccount from '../validators/validateAccount';
import AuthService from '../../AuthService';
import validateSession from '../validators/validateSession';
import validateDomainAccess from '../validators/validateDomainAccess';

export default function ensureEntityPermission(func) {
    return pipe([
        validateExtension,
        (_, args) => AuthService.ensureAccount(args),
        validateSession,
        validateDomainAccess,
        func,
    ]);
}
