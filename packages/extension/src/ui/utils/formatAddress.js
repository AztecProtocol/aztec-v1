export default function formatAddress(address, prefixLength = 6, suffixLength = 4) {
    return `${address.slice(0, prefixLength)}...${address.substr(-suffixLength)}`;
}
