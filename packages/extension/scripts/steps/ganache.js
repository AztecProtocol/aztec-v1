import ganache from '../tasks/ganache/cli';
import generateAccounts from '../utils/accounts';

export default async function launchGanache() {
    const accounts = generateAccounts();
    const params = ['-p', 8545, '-i', 'development'].concat(accounts);
    return ganache.launch(params);
}
