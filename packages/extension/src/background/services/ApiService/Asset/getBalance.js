import apollo from '../../GraphQLService';
import AssetBalanceQuery from '../../../../ui/queries/AssetBalanceQuery';

export default async function asset(query) {
    const {
        data: { args },
        domain,
    } = query;
    const { data } = await apollo.query({
        query: AssetBalanceQuery,
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
