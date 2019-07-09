import domainModel from '~database/models/domain';

export default async function enableDomain(_, args) {
    const {
        domain,
        graphQLServer,
    } = args;

    let {
        data,
    } = await domainModel.set(
        {
            domain,
            graphQLServer,
        },
        {
            ignoreDuplicate: true,
        },
    );

    const {
        graphQLServer: prevGraphQLServer,
    } = data;
    if (graphQLServer !== prevGraphQLServer) {
        ({
            data,
        } = await domainModel.update({
            domain,
            graphQLServer,
        }));
    }

    return data;
}
