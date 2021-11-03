const initializeLocklift = require('../../utils/initializeLocklift');
const configuration = require('../../scripts.conf');
const { loadContractData, writeContractData } = require('../../utils/migration/manageContractData');
const { Staking } = require('../modules/staking');
const { convertCrystal } = require('locklift/locklift/utils');
const { operationFlags } = require('../../utils/transferFlags');
const { MsigWallet, extendContractToWallet } = require('../../wallet/modules/walletWrapper');



async function main() {

    let locklift = await initializeLocklift(configuration.pathToLockliftConfig, configuration.network);
    let staking = new Staking(await loadContractData(locklift, configuration, `${configuration.network}_Staking.json`));
    /**
     * @type {MsigWallet}
     */
    let msigWallet = await loadContractData(locklift, configuration, `${configuration.network}_MsigWallet.json`);
    msigWallet = extendContractToWallet(msigWallet)

    console.log(await staking.rankings());

    console.log(JSON.stringify(await staking.ownerInfo(), null, '\t'));

    console.log(await staking.pools());

    console.log(await staking.getUserReward({
        _user: msigWallet.address,
        _poolId: 2
    }));
}

main().then(
    () => process.exit()
).catch(
    (err) => {
        console.log(err);
    }
)