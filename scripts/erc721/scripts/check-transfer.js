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

    let address = locklift.utils.zeroAddress.replace(/0$/, '1');

    let transferTokenPayload = await ercContract.transferTokenTo({
        tokenID: 14,
        receiver: address
    });

    await msigWallet.transfer({
        destination: ercContract.address,
        value: convertCrystal(1, 'nano'),
        flags: operationFlags.FEE_FROM_CONTRACT_BALANCE,
        bounce: true,
        payload: transferTokenPayload
    });

    console.log(await ercContract.getOwnerOf({ tokenID: 1 }));

    console.log(await ercContract.getUserNfts({ collector: address }));

    console.log((await ercContract.getUserNfts({ collector: msigWallet.address })));

}

main().then(
    () => process.exit(0)
).catch(
    (err) => {
        console.log(err);
        process.exit(1);
    }
)