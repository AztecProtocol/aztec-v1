
module.exports = (db, networkId) => {
    const {
        Dapps,
        Transactions,
    } = db;

    const parent = {
        name: 'Mainnet',
        icon: 'fa fa-file-text',
    }

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
        ],
        branding: {
            companyName: 'AZTEC',
            softwareBrothers: false,
        },
    };
};