import ConnectionService from '~/client/services/ConnectionService';

export default async function query({ type, args }) {
    return ConnectionService.query(type, args);
}
