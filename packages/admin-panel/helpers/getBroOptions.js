const bcrypt = require('bcrypt');
const uuidAPIKey = require('uuid-apikey');
const AdminBro = require('admin-bro');
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

    const isAdmin = ({ currentAdmin }) => currentAdmin && currentAdmin.role === USER_TYPE.ADMIN && currentAdmin.isEnabled;

    return {
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
                        status: {
                            isVisible: { list: true, filter: false, show: true, edit: true },
                        },
                        type: {
                            isVisible: { list: true, filter: false, show: true, edit: true },
                        },
                    },
                },
            },
            { resource: Dapps,
                options: {
                    parent,
                    properties: {
                        apiKey: {
                            isVisible: { list: false, filter: true, show: true, edit: false },
                        },
                    },
                    actions: {
                        new: {
                            before: async (request) => {
                                const {
                                    apiKey,
                                } = uuidAPIKey.create();
                                request.payload.record = {
                                    ...request.payload.record,
                                    apiKey,
                                };
                                return request;
                            },
                            isAccessible: isAdmin,
                        },
                        edit: { isAccessible: isAdmin },
                        delete: { isAccessible: isAdmin },
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
                        role: {
                            isVisible: { list: true, filter: false, show: true, edit: true },
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
                            isAccessible: isAdmin,
                        },
                        edit: { isAccessible: isAdmin },
                        delete: { isAccessible: isAdmin },
                    },
                },
            },
        ],
        branding: {
            logo: '/static/images/logo.svg',
            companyName: 'AZTEC',
            softwareBrothers: false,
        },
        dashboard: {
            handler: async () => {
            },
            component: AdminBro.bundle('../components/dashboard'),
        },
    };
};