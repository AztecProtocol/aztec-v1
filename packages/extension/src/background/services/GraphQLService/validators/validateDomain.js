import {
    permissionError,
} from '~utils/error';
import AuthService from '~background/services/AuthService';

export default async function validateDomain(_, args) {
    const { domain } = args;

    const registeredDomain = await AuthService.getRegisteredDomain(domain);

    if (!registeredDomain) {
        return permissionError('domain.not.register', {
            messageOptions: {
                domain,
            },
        });
    }

    return {
        domain: registeredDomain,
    };
}
