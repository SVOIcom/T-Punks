const { convertCrystal } = require("locklift/locklift/utils");
const configuration = require("../../scripts.conf");
const initializeLocklift = require("../../utils/initializeLocklift");
const { loadContractData } = require("../../utils/migration/manageContractData");
const { operationFlags } = require("../../utils/transferFlags");
const { stringToBytesArray } = require("../../utils/utils");
const { extendContractToWallet, MsigWallet } = require("../../wallet/modules/walletWrapper");
const { extendContractToERC721, ERC721 } = require("../modules/extendContractToERC721");

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

    console.log(await ercContract.getTokenPrice());

    console.log(await ercContract.getTokenSupplyInfo());

    console.log(Object.keys(await ercContract.getAllNfts()).length);

    console.log(await ercContract.getNft({ nftID: 0 }));

    console.log(await ercContract.getOwnerOf({ tokenID: 0 }));

    console.log(await ercContract.getUserNfts({ collector: msigWallet.address }));

    console.log(Object.keys(await ercContract.getUserNfts({ collector: msigWallet.address })).length);

    // let result = await ercContract.getUserNfts({ collector: msigWallet.address });
    // for (let i = 0; i < 1; i++) {
    //     if (!result[i]) {
    //         console.log(`${i} - not minted`)
    //     }
    // }
}

main().then(
    () => process.exit(0)
).catch(
    (err) => {
        console.log(err);
        process.exit(1);
    }
)