import assetsConfig from '~ui/config/assets';

export default function icon(code) {
    const {
        iconSrc,
    } = assetsConfig[code] || {};

    return iconSrc;
}
