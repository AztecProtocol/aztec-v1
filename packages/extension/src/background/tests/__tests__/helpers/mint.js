export default async function mint({
    web3Service,
    erc20Address,
    owner,
    amount,
}) {
    await web3Service
        .useContract('ERC20Mintable')
        .at(erc20Address)
        .method('mint')
        .send(
            owner,
            amount,
        );
}
