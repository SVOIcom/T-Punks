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

    const punks = require('../../../punks.json');

    let uploadCount = 100;
    let currentUpload = 0;

    for (let p of punks) {
        let result = await ercContract.getNft({
            nftID: p.idx
        });
        let idC = p.idx == result.id;
        let typeC = p.type == result.punkType;
        let attributesC = p.attributes.join('|') == result.attributes;
        let rankC = p.rank == result.rank;
        let total = idC && typeC && attributesC && rankC;
        console.log(`total: ${total}; id: ${p.idx} | ${idC}; type: ${typeC}; attributes: ${attributesC}; rank: ${rankC}`);

        if (!total) {
            console.log(`${p.idx} invalid`);
        }

        currentUpload += 1;
        if (currentUpload > uploadCount) {
            break
        }
    }
}

main().then(
    () => process.exit(0)
).catch(
    (err) => {
        console.log(err);
        process.exit(1);
    }
)