export default function valueOf(note) {
    const {
        k,
    } = note || {};

    return (k && k.toNumber()) || 0;
}
