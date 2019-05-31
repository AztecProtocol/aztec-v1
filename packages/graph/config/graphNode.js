export default {
    name: 'note-management',
    githubUser: 'aztec',
    manifest: 'subgraph.yaml',
    networks: {
        test: {
            node: 'http://127.0.0.1:8020',
            ipfs: 'http://localhost:5001',
            http: {
                path: '/subgraphs/name',
                port: 8000,
            },
            ws: {
                path: '/subgraphs/name',
                port: 8001,
            },
        },
        development: {
            node: 'http://127.0.0.1:8020',
            ipfs: 'http://localhost:5001',
            http: {
                path: '/subgraphs/name',
                port: 8000,
            },
            ws: {
                path: '/subgraphs/name',
                port: 8001,
            },
        },
        production: {
            node: 'https://api.thegraph.com/deploy/',
            ipfs: 'https://api.thegraph.com/ipfs/',
        },
    },
    databases: {
        test: {
            name: 'graph-node',
            host: 'localhost',
            port: 5432,
            user: 'graph-node',
            password: '',
        },
        development: {
            name: 'graph-node',
            host: 'localhost',
            port: 5432,
            user: 'graph-node',
            password: '',
        },
        production: {
            name: '',
        },
    },
};
