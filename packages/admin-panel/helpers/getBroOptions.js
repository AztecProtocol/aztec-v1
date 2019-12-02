const bcrypt = require('bcrypt');
const {
    USER_TYPE,
} = require('../config/constants');


module.exports = (db, networkConfig) => {
    const {
        Dapps,
        Transactions,
        Users,
    } = db;

    const parent = {
        name: networkConfig.networkName.toUpperCase(),
        icon: 'fa fa-file-text',
    };

    const canModifyUsers = ({ currentAdmin }) => currentAdmin && currentAdmin.role === USER_TYPE.ADMIN;

    return {
        rootPath: '/admin',
        resources: [
            { resource: Transactions,
                options: {
                    parent,
                    properties: {
                        from: {
                            isVisible: { list: false, filter: true, show: true, edit: true },
                        },
                        signatureHash: {
                            isVisible: { list: false, filter: true, show: true, edit: true },
                        },
                        nonce: {
                            isVisible: { list: false, filter: true, show: true, edit: true },
                        },
                        actualCharge: {
                            isVisible: { list: false, filter: true, show: true, edit: true },
                        },
                    },
                },
            },
            { resource: Dapps,
                options: {
                    parent,
                    properties: {
                        apiKey: {
                            isVisible: { list: false, filter: true, show: true, edit: true },
                        },
                    },
                },
            },
            { resource: Users,
                options: {
                    parent,
                    properties: {
                        passwordHash: {
                            isVisible: false,
                        },
                        password: {
                            type: 'string',
                            isVisible: {
                                list: false, edit: true, filter: false, show: false,
                            },
                        },
                    },
                    actions: {
                        new: {
                            before: async (request) => {
                                if(request.payload.record.password) {
                                    request.payload.record = {
                                        ...request.payload.record,
                                        passwordHash: await bcrypt.hash(request.payload.record.password, 10),
                                        password: undefined,
                                    };
                                }
                                return request;
                            },
                            isAccessible: canModifyUsers,
                        },
                        edit: { isAccessible: canModifyUsers },
                        delete: { isAccessible: canModifyUsers },
                    },
                },
            },
        ],
        branding: {
            companyName: 'AZTEC',
            softwareBrothers: false,
        },
    };
};