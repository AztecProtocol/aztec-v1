const lenDiff = (len, targetLen) => {
    let diff = (len | 0) - targetLen; // eslint-disable-line no-bitwise
    if (diff < 0) {
        diff *= -10;
    }
    return diff;
};

export default function findOptimalIcon(icons, dimension) {
    const {
        width,
        height,
    } = dimension;

    let optimalIcon = icons[0];
    let minDiff = Infinity;
    icons.forEach((icon) => {
        const {
            sizes,
        } = icon;
        if (!sizes) return;

        const [w, h] = sizes.split('x');
        const diff = lenDiff(w, width) + lenDiff(h, height);
        if (diff < minDiff) {
            minDiff = diff;
            optimalIcon = icon;
        }
    });

    return optimalIcon;
}
