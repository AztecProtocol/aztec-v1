import AuthService from '~background/services/AuthService';

export default async function approveDomain({
    domain,
}) {
    let success;
    console.log({ domain });
    try {
        const response = await AuthService.registerDomain(domain);
        success = !!response && !response.error;
    } catch (e) {
        success = false;
    }

    return {
        success,
    };
}
