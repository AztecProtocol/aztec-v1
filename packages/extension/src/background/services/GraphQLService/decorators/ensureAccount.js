import pipe from '../utils/pipe';
import AuthService from '../../AuthService';

export default function ensureAccount(func) {
    return pipe([
        (_, args) => AuthService.ensureAccount(args),
        func,
    ]);
}
