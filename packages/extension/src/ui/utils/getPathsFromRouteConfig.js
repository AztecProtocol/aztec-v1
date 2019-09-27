export default function getPathsFromRouteConfig(config) {
    const paths = {};
    Object.keys(config).forEach((name) => {
        const {
            path = '/',
            routes: childRoutes,
        } = config[name];

        if (!childRoutes) {
            paths[name] = path;
        } else {
            const childPaths = getPathsFromRouteConfig(childRoutes);
            paths[name] = {
                ...childPaths,
                _: path,
            };
        }
    });

    return paths;
}
