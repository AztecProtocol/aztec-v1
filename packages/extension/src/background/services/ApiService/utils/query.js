import apollo from '../../GraphQLService';

export default async function query(request, Query) {
    const {
        domain,
        data: {
            args,
        },
    } = request;

    const { data } = await apollo.query({
        query: Query,
        variables: {
            ...args,
            domain,
        },
    }) || {};

    return {
        ...request,
        data,
    };
}
