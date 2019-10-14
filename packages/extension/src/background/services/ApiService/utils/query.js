import apollo from '../../GraphQLService';

export default async function query(request, Query) {
    const {
        data: { args },
        domain,
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
        response: data,
    };
}
