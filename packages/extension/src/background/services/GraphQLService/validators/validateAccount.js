import AuthService from '~backgroundServices/AuthService';

export default async function validateAccount(_, args) {
    const {
        currentAddress,
    } = args;
    return AuthService.validateUserAddress(currentAddress);
}
