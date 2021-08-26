const initializeLocklift = require('../../utils/initializeLocklift');
const configuration = require('../../scripts.conf');
const { loadContractData, writeContractData } = require('../../utils/migration/manageContractData');

async function main() {
    let locklift = await initializeLocklift(configuration.pathToLockliftConfig, configuration.network);
    let ercContract = await locklift.factory.getContract('ERC721', configuration.buildDirectory);
    let msigWallet = await loadContractData(locklift, configuration, `${configuration.network}_MsigWallet.json`);

    // console.log(await locklift.ton.createDeployMessage({
    //     contract: ercContract,
    //     constructorParams: {
    //         owner_: msigWallet.address
    //     },
    //     initParams: {},
    //     keyPair: msigWallet.keyPair,
    // }));

    // const {
    //     address,
    // } = await locklift.ton.createDeployMessage({
    //     contract: ercContract,
    //     constructorParams: {
    //         owner_: msigWallet.address
    //     },
    //     initParams: {},
    //     keyPair: msigWallet.keyPair,
    // });

    // const message = await locklift.ton.createDeployMessage({
    //     contract: ercContract,
    //     constructorParams: {
    //         owner_: msigWallet.address
    //     },
    //     initParams: {},
    //     keyPair: msigWallet.keyPair,
    // });

    // await locklift.ton.waitForRunTransaction({ message, abi: ercContract.abi });

    // ercContract.setAddress(address);

    await locklift.giver.deployContract({
        contract: ercContract,
        constructorParams: {
            owner_: msigWallet.address
        },
        initParams: {},
        keyPair: msigWallet.keyPair
    });

    await writeContractData(ercContract, `ERC721.json`);
}

main().then(
    () => process.exit(0)
).catch(
    (err) => {
        console.log(err);
        process.exit(1);
    }
)