import AuthService from '~/background/services/AuthService';

const isDaysAgo = (day, numberOfDays) => day < Date.now() - (numberOfDays * 60 * 60 * 24 * 1000);

export default async function getSession() {
    const session = await AuthService.getSession();
    const {
        address,
        createdAt,
        lastActive,
    } = session || {};

    const valid = !!address
        && !!session
        && !isDaysAgo(createdAt, 21)
        && !isDaysAgo(lastActive, 7);

    return {
        address,
        valid,
    };
}
