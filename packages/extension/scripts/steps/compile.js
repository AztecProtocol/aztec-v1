import compile from '../tasks/truffle/compile';

export default async function compileProtocolContracts() {
    const compileProtocol = compile('protocol');
    return compileProtocol.launch([]);
}
