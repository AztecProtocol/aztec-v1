import watch from '../tasks/yarn/watch';

export default async function watchSDK() {
    const watchFn = watch('extension');

    return watchFn.launch([]);
}
