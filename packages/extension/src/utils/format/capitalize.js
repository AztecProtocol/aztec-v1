export default function capitalize(str) {
    if (!str) {
        return '';
    }

    if (str.match(/^[a-z]{0,}[A-Z]/)) {
        return str;
    }

    return `${str[0].toUpperCase()}${str.slice(1)}`;
}
