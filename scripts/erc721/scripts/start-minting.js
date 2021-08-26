const { convertCrystal } = require("locklift/locklift/utils");
const configuration = require("../../scripts.conf");
const initializeLocklift = require("../../utils/initializeLocklift");
const { loadContractData } = require("../../utils/migration/manageContractData");
const { operationFlags } = require("../../utils/transferFlags");
const { stringToBytesArray } = require("../../utils/utils");
const { extendContractToWallet, MsigWallet } = require("../../wallet/modules/walletWrapper");
const { extendContractToERC721, ERC721 } = require("../modules/extendContractToERC721");

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function main() {
    let locklift = await initializeLocklift(configuration.pathToLockliftConfig, configuration.network);

    /**
     * @type {MsigWallet}
     */
    let msigWallet = await loadContractData(locklift, configuration, `${configuration.network}_MsigWallet.json`);
    msigWallet = extendContractToWallet(msigWallet)

    /**
     * @type {ERC721}
     */
    let ercContract = await loadContractData(locklift, configuration, `${configuration.network}_ERC721.json`);
    ercContract = extendContractToERC721(ercContract);

    // await locklift.giver.giver.run({
    //     method: 'sendGrams',
    //     params: {
    //         dest: msigWallet.address,
    //         amount: locklift.utils.convertCrystal(5000, 'nano')
    //     },
    //     keyPair: msigWallet.keyPair
    // });

    let startMinting = await ercContract.startSell();

    await msigWallet.transfer({
        destination: ercContract.address,
        value: convertCrystal(1, 'nano'),
        flags: operationFlags.FEE_FROM_CONTRACT_BALANCE,
        bounce: false,
        payload: startMinting
    });

    let pricePayload = await ercContract.setBuyPrice({
        priceForSale_: convertCrystal(2, 'nano')
    });

    await msigWallet.transfer({
        destination: ercContract.address,
        value: convertCrystal(1, 'nano'),
        flags: operationFlags.FEE_FROM_CONTRACT_BALANCE,
        bounce: false,
        payload: pricePayload
    });



    let uploadCount = 1;

    for (let currentUpload = 0; currentUpload < uploadCount; currentUpload++) {
        console.log(`Minting punk: ${currentUpload}`);
        console.log(`Collection size: ${Object.keys(await ercContract.getUserNfts({ collector: msigWallet.address })).length}`)
        let punkMintPayload = await ercContract.mintToken({ referal: msigWallet.address });

        await msigWallet.transfer({
            destination: ercContract.address,
            value: convertCrystal(50.5, 'nano'),
            flags: operationFlags.FEE_FROM_CONTRACT_BALANCE,
            bounce: true,
            payload: punkMintPayload
        });
    }

    console.log(`Collection size: ${Object.keys(await ercContract.getUserNfts({ collector: msigWallet.address })).length}`);
}

main().then(
    () => process.exit(0)
).catch(
    (err) => {
        console.log(err);
        process.exit(1);
    }
)