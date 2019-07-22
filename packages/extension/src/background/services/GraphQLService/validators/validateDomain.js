import AuthService from '~backgroundServices/AuthService';

export default async function validateDomain(_, args) {
    const { domain } = args;
    return AuthService.validateDomain(domain);
}
