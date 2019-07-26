import AuthService from '~backgroundServices/AuthService';

export default async function validateExtension(_, args) {
    return AuthService.validateExtension(_, args,);
}
