export default function formatHash(hash, prefixLength = 0, suffixLength = 0) {
    if (prefixLength + suffixLength >= hash.length) {
        return hash;
    }

    return `${hash.slice(0, prefixLength)}...${!suffixLength ? '' : hash.substr(-suffixLength)}`;
}
