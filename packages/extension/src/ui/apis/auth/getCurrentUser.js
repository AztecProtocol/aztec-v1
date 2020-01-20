import AuthService from '~/background/services/AuthService';

export default async function getCurrentUser() {
    return AuthService.getCurrentUser();
}
