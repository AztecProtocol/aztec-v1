import NetworkService from './factory';

export default async (networkId, account) => NetworkService.create(networkId, account);
