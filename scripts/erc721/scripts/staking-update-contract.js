const { convertCrystal } = require("locklift/locklift/utils");
const configuration = require("../../scripts.conf");
const initializeLocklift = require("../../utils/initializeLocklift");
const { loadContractData } = require("../../utils/migration/manageContractData");
const { operationFlags } = require("../../utils/transferFlags");
const { extendContractToWallet, MsigWallet } = require("../../wallet/modules/walletWrapper");
const { Staking } = require("../modules/staking");

async function main() {
    let locklift = await initializeLocklift(configuration.pathToLockliftConfig, configuration.network);

    /**
     * @type {MsigWallet}
     */
    let msigWallet = await loadContractData(locklift, configuration, `${configuration.network}_MsigWallet.json`);
    msigWallet = extendContractToWallet(msigWallet)

    /**
     * @type {Staking}
     */
    let staking = new Staking(await loadContractData(locklift, configuration, `${configuration.network}_Staking.json`));

    let upgradeContractPayload = await staking.upgradeContractCode({
        code: staking.code,
        updateParams: '',
        codeVersion_: 2
    });

    await msigWallet.transfer({
        destination: staking.address,
        value: convertCrystal(2, 'nano'),
        flags: operationFlags.FEE_FROM_CONTRACT_BALANCE,
        bounce: true,
        payload: upgradeContractPayload
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