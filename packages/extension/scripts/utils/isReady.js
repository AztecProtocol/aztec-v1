export default function isReadyPredicateFactory(text) {
    return output => output.includes(text);
}
