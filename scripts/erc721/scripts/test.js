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
    let msigWallet = await loadContractData(locklift, configuration, `devnet_MsigWallet.json`);
    msigWallet = extendContractToWallet(msigWallet)

    msigWallet.setAddress('0:f8dff467ed5baf384fa47c5b930d0c22be4a327d7b88bd0695d0e1f1a6ee223e');

    let messages = await locklift.ton.client.net.query_collection({
        collection: 'transactions',
        filter: {
            id: { eq: '8f9e264f0e202ca4657ce9f49ab479761e769695b13c63572e90dcba3b4450d2' }
        },
        result: 'status tr_type orig_status end_status total_fees compute_type'
    });

    console.log(messages);
    // for (let message of messages.result) {

    //     try {
    //         const decodedMessage = await locklift.ton.client.abi.decode_message_body({
    //             abi: {
    //                 type: 'Contract',
    //                 value: msigWallet.abi
    //             },
    //             body: message.body,
    //             is_internal,
    //         });
    //     } catch (err) {
    //         console.log('cannot decode');
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