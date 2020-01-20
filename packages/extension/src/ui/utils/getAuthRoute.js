export default function getAuthRoute({
    currentAddress,
    onChainLinkedPublicKey,
    validSession,
    localAddress,
    localLinkedPublicKey,
}) {
    let route = 'register';

    if (onChainLinkedPublicKey) {
        if (localAddress === currentAddress
            && localLinkedPublicKey === onChainLinkedPublicKey
        ) {
            route = 'account.login';
        } else {
            route = 'account.restore';
        }
    } else if (validSession
        && localLinkedPublicKey
    ) {
        route = 'register.address';
    }

    return route;
}
