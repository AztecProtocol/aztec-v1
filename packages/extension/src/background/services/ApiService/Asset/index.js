import apollo from '../../GraphQLService';
import AssetQuery from '../../../../ui/queries/AssetQuery';

export default async function asset(query) {
    const {
        data: { args },
        domain,
    } = query;
    const { data } = await apollo.query({
        query: AssetQuery,
        variables: {
            ...args,
            domain,
        },
    }) || {};

    return {
        ...query,
        response: data,
    };
}
