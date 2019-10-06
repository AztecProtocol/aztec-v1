export default async function mint({
    web3Service,
    erc20Address,
    aceAddress,
    amount,
}) {
    await web3Service
        .useContract('ERC20Mintable')
        .at(erc20Address)
        .method('approve')
        .send(
            aceAddress,
            amount,
        );
}
