import build from '../tasks/yarn/build';

export default async function buildExtension() {
    const buildFn = build('extension');

    return buildFn.launch([]);
}
