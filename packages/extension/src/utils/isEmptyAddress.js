export default function isEmptyAddress(address) {
    return !address
        || address.match(/^0x0{40}$/);
}
