import mutate from '../utils/mutate';

export default {
    enableAsset: async ({domain, asset}) => {
        return await mutate(`
            enableAssetForDomain(domain: "${domain}", asset: "${asset}") 
        `)
    },
    login: ({
        password
    }) => mutate(`
        login(password: "${password}") 
    `),
    registerExtension:({password, salt}) => {
        return mutate(` 
        registerExtension(password: "${password}", salt: "${salt}") {
            publicKey
        }
    `);
    }
};
