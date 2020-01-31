import {
    permissionError,
} from '~/utils/error';
import urls from '~/config/urls';
import AuthService from '~/background/services/AuthService';

const {
    origin: uiSourceOrigin,
} = new URL(urls.ui);
const {
    origin: backgroundSourceOrigin,
} = new URL(urls.background);

export default async function validateDomain(_, args) {
    const { domain } = args;

    const registeredDomain = domain === uiSourceOrigin || domain === backgroundSourceOrigin
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
