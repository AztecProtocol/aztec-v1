import AuthService from '~backgroundServices/AuthService';

export default async function validateSession(_, args) {
    return AuthService.validateSession(args);
}
