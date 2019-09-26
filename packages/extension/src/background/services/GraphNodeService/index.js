import Query from '~utils/Query';

class GraphNodeService {
    constructor() {
        this.config = {
            graphNodeServerUrl: '',
        };
    }

    set(config) {
        Object.keys(this.config)
            .forEach((key) => {
                if (config[key] !== undefined) {
                    this.config[key] = config[key];
                }
            });
    }

    query(query) {
        console.log(`trid fired query: ${JSON.stringify(query)}`);
        
        const settings = typeof query !== 'string'
            ? query
            : { query };

        const {
            graphNodeServerUrl,
        } = this.config;

        return Query({
            ...settings,
            graphQLServerUrl: graphNodeServerUrl,
        });
    }
}

export default new GraphNodeService();
