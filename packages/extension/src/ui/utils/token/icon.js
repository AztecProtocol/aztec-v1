import tokensConfig from '~ui/config/tokens';

export default function icon(code) {
    const {
        iconSrc,
    } = tokensConfig[code] || {};

    return iconSrc;
}
