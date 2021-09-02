const { convertCrystal } = require("locklift/locklift/utils");
const configuration = require("../../scripts.conf");
const initializeLocklift = require("../../utils/initializeLocklift");
const { loadContractData } = require("../../utils/migration/manageContractData");
const { operationFlags } = require("../../utils/transferFlags");
const { stringToBytesArray, encodeMessageBody } = require("../../utils/utils");
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

    let tokens = await ercContract.getUserNfts({ collector: msigWallet.address });

    console.log(await ercContract.call({
        method: 'getTokenSellPrice',
        params: {},
        keyPair: msigWallet.keyPair
    }));

    await msigWallet.transfer({
        destination: ercContract.address,
        value: convertCrystal(1, 'nano'),
        flags: operationFlags.FEE_FROM_CONTRACT_BALANCE,
        bounce: true,
        payload: await encodeMessageBody({
            contract: ercContract,
            functionName: 'setSellPrice',
            input: {
                priceForSale_: convertCrystal(10, 'nano')
            }
        })
    });

    console.log(await ercContract.call({
        method: 'getTokenSellPrice',
        params: {},
        keyPair: msigWallet.keyPair
    }));

    for (let tokenID in tokens) {
        await msigWallet.transfer({
            destination: ercContract.address,
            value: convertCrystal(1, 'nano'),
            flags: operationFlags.FEE_FROM_CONTRACT_BALANCE,
            bounce: true,
            payload: await ercContract.setForSale({
                tokenID: tokenID,
                tokenPrice: convertCrystal(11, 'nano')
            })
        });
    }

    console.log(await ercContract.getAllTokensForSale());



    await msigWallet.transfer({
        destination: ercContract.address,
        value: convertCrystal(11.5, 'nano'),
        flags: operationFlags.FEE_FROM_CONTRACT_BALANCE,
        bounce: true,
        payload: await ercContract.buyToken({
            tokenID: 9999
        })
    });

    console.log(await ercContract.getAllTokensForSale());
}

main().then(
    () => process.exit(0)
).catch(
    (err) => {
        console.log(err);
        process.exit(1);
    }
)