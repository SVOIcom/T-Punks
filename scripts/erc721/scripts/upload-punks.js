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

    const punks = require('../../../punks.json');

    let uploadCount = 200;
    let currentUpload = 9960;

    let internalCounter = 0;
    let punksArray = [];

    let uploadBatchSize = 20;

    for (let p of punks) {
        if (currentUpload <= 9979) {
            p = punks[currentUpload];
            let punkUploadPayload = await ercContract.uploadToken({
                punkInfo: [{
                    id: p.idx,
                    punkType: stringToBytesArray(p.type),
                    attributes: stringToBytesArray(p.attributes.join('|')),
                    rank: p.rank
                }]
            });

            await msigWallet.transfer({
                destination: ercContract.address,
                value: convertCrystal(1, 'nano'),
                flags: operationFlags.FEE_FROM_CONTRACT_BALANCE,
                bounce: false,
                payload: punkUploadPayload
            });
            currentUpload += 1;
            console.log(`Uploaded punk: ${currentUpload}`);
        } else {
            break;
        }
    }

    // p = punks[9999];
    // let punkUploadPayload = await ercContract.uploadToken({
    //     punkInfo: [{
    //         id: p.idx,
    //         punkType: stringToBytesArray(p.type),
    //         attributes: stringToBytesArray(p.attributes.join('|')),
    //         rank: p.rank
    //     }]
    // });

    // await msigWallet.transfer({
    //     destination: ercContract.address,
    //     value: convertCrystal(1, 'nano'),
    //     flags: operationFlags.FEE_FROM_CONTRACT_BALANCE,
    //     bounce: false,
    //     payload: punkUploadPayload
    // });
    // currentUpload += 1;
    // console.log(`Uploaded punk: ${9999}`);

    // let payload = await encodeMessageBody({
    //     contract: ercContract,
    //     functionName: '_setTokenAmount',
    //     input: {
    //         tokensLeft_: 10000,
    //         totalTokens_: 10000
    //     }
    // });

    // await msigWallet.transfer({
    //     destination: ercContract.address,
    //     value: convertCrystal(1, 'nano'),
    //     flags: operationFlags.FEE_FROM_CONTRACT_BALANCE,
    //     bounce: false,
    //     payload: payload
    // });

    // for (let p of punks) {
    //     if (currentUpload >= 9980) {
    //         p = punks[currentUpload];
    //         let punkUploadPayload = await ercContract.uploadToken({
    //             punkInfo: [{
    //                 id: p.idx,
    //                 punkType: stringToBytesArray(p.type),
    //                 attributes: stringToBytesArray(p.attributes.join('|')),
    //                 rank: p.rank
    //             }]
    //         });

    //         await msigWallet.transfer({
    //             destination: ercContract.address,
    //             value: convertCrystal(1, 'nano'),
    //             flags: operationFlags.FEE_FROM_CONTRACT_BALANCE,
    //             bounce: false,
    //             payload: punkUploadPayload
    //         });
    //         console.log(`Uploaded punk: ${currentUpload}`);
    //     } else {
    //         if (internalCounter == uploadBatchSize) {
    //             let punkUploadPayload = await ercContract.uploadToken({
    //                 punkInfo: punksArray
    //             });

    //             punksArray = [];
    //             internalCounter = 0;

    //             await msigWallet.transfer({
    //                 destination: ercContract.address,
    //                 value: convertCrystal(1, 'nano'),
    //                 flags: operationFlags.FEE_FROM_CONTRACT_BALANCE,
    //                 bounce: false,
    //                 payload: punkUploadPayload
    //             });
    //             console.log(`Uploaded punk: ${currentUpload}`);
    //         }
    //     }
    //     punksArray.push({
    //         id: p.idx,
    //         punkType: stringToBytesArray(p.type),
    //         attributes: stringToBytesArray(p.attributes.join('|')),
    //         rank: p.rank
    //     });
    //     internalCounter += 1;
    //     currentUpload += 1;
    //     console.log(`Adding punk: ${currentUpload}`);
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