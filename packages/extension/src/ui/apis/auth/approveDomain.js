import AuthService from '~/background/services/AuthService';

export default async function approveDomain({
    domain,
}) {
    let success;
    try {
        const response = await AuthService.registerDomain(domain.domain);
        success = !!response && !response.error;
    } catch (e) {
        success = false;
    }

    return {
        success,
    };
}
