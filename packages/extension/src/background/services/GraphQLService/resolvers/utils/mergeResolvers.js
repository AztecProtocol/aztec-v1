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
            ...resolver1,
            ...resolver2,
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
