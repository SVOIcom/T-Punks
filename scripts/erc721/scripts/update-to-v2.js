const { convertCrystal } = require("locklift/locklift/utils");
const Contract = require('locklift/locklift/contract');
const configuration = require("../../scripts.conf");
const initializeLocklift = require("../../utils/initializeLocklift");
const { loadContractData } = require("../../utils/migration/manageContractData");
const { operationFlags } = require("../../utils/transferFlags");
const { stringToBytesArray, encodeMessageBody } = require("../../utils/utils");
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

    /**
     * @type {Contract}
     */
    let ercContractv2 = await locklift.factory.getContract('ERC721_v2', configuration.buildDirectory);

    await msigWallet.transfer({
        destination: ercContract.address,
        value: convertCrystal(1, 'nano'),
        flags: operationFlags.FEE_FROM_CONTRACT_BALANCE,
        bounce: true,
        payload: await ercContract.upgradeContractCode({
            code: ercContractv2.code,
            updateParams: '',
            codeVersion_: 1
        })
    });
}

main().then(
    () => process.exit(0)
).catch(
    (err) => {
        console.log(err);
        process.exit(1);
    }
)