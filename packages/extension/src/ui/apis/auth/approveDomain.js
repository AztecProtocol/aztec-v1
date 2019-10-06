import ApproveDomain from '~ui/mutations/ApproveDomain';
import apollo from '~ui/apis/helpers/apollo';

export default async function approveDomain({
    address,
    domain,
}) {
    const {
        registerDomain: {
            success,
        },
    } = await apollo.mutate({
        mutation: ApproveDomain,
        variables: {
            address,
            domain,
        },
    });

    return { success };
}
