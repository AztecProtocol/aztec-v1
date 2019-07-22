import AuthService from '~backgroundServices/AuthService';

export default async function validateSession() {
    return AuthService.validateSession();
}
