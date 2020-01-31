import {
    permissionError,
} from '~/utils/error';
import {
    getResourceUrl,
} from '~/utils/versionControl';
import AuthService from '~/background/services/AuthService';

const resourceOrigin = getResourceUrl('origin');

export default async function validateDomain(_, args) {
    const { domain } = args;

    const registeredDomain = domain === resourceOrigin
        ? domain
        : await AuthService.getRegisteredDomain(domain);

    if (!registeredDomain) {
        return permissionError('domain.not.register', {
            messageOptions: {
                domain,
            },
            ...args,
        });
    }

    return {
        domain: registeredDomain,
    };
}
