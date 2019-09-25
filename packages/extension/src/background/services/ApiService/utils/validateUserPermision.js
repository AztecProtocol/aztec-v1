import apollo from '../../GraphQLService';
import UserPermissionQuery from '../../../../ui/queries/UserPermissionQuery';

export default async function validateUserPermission(variables) {
    const { data } = await apollo.query({
        query: UserPermissionQuery,
        variables,
    }) || {};
    return data;
}
