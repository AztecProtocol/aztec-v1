import query from '../utils/query';

export default async function registerDomain() {
    const data = await query({
        type: 'registerDomain',
        args: {
            domain: window.location.origin,
        },
    }) || {};

    return data;
}
