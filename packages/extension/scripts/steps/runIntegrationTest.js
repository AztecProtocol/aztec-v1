import test from '../tasks/truffle/test';

export default async function buildExtension() {
    return test.launch(['./test/*'], {
        silent: false,
    });
}
