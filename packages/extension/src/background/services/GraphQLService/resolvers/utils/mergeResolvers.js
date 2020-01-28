const mergeSubType = (resolver1, resolver2) => {
    const resolver = {
        ...resolver2,
    };
    Object.keys(resolver1).forEach((key) => {
        resolver[key] = !resolver[key]
            ? resolver1[key]
            : {
                ...resolver1[key],
                ...resolver[key],
            };
    });

    return resolver;
};

export default function mergeResolvers(...resolvers) {
    return resolvers.reduce((accum, resolver) => {
        const {
            Query: Query1,
            Mutation: Mutation1,
            ...resolver1
        } = accum;
        const {
            Query: Query2,
            Mutation: Mutation2,
            ...resolver2
        } = resolver;

        return {
            ...mergeSubType(resolver1, resolver2),
            Query: {
                ...Query1,
                ...Query2,
            },
            Mutation: {
                ...Mutation1,
                ...Mutation2,
            },
        };
    }, {});
}
