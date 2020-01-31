export default function simplePluralize(phrase, locale = 'en') {
    // TODO - add more rules
    switch (locale) {
        case 'en':
            return `${phrase}s`;
        default:
    }

    return phrase;
}
