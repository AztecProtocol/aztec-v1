import migrate from '../tasks/truffle/migrate';

export default async function migrateProtocolContracts() {
    const migrateProtocol = migrate('protocol');
    return migrateProtocol.launch(['--network', 'test', '--reset']);
}
