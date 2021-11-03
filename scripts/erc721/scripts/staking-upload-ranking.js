const initializeLocklift = require('../../utils/initializeLocklift');
const configuration = require('../../scripts.conf');
const { loadContractData, writeContractData } = require('../../utils/migration/manageContractData');
const { Staking } = require('../modules/staking');
const { convertCrystal } = require('locklift/locklift/utils');
const { operationFlags } = require('../../utils/transferFlags');
const { MsigWallet, extendContractToWallet } = require('../../wallet/modules/walletWrapper');



async function main() {
    let rankings = {
        '150': {low: 0, high: 50},
        '75': {low: 50, high: 100},
        '50': {low: 100, high: 500},
        '40': {low: 500, high: 1000},
        '37': {low: 1000, high: 1500},
        '35': {low: 1500, high: 2000},
        '32': {low: 2000, high: 3000},
        '30': {low: 3000, high: 4000},
        '27': {low: 4000, high: 5000},
        '25': {low: 5000, high: 6000},
        '23': {low: 6000, high: 7000},
        '20': {low: 7000, high: 8000},
        '15': {low: 8000, high: 9000},
        '10': {low: 9000, high: 10000},
    };

    let locklift = await initializeLocklift(configuration.pathToLockliftConfig, configuration.network);
    let staking = new Staking(await loadContractData(locklift, configuration, `${configuration.network}_Staking.json`));
    /**
     * @type {MsigWallet}
     */
    let msigWallet = await loadContractData(locklift, configuration, `${configuration.network}_MsigWallet.json`);
    msigWallet = extendContractToWallet(msigWallet)
    
    let payload = await staking.uploadRankingInfo({
        _rankings: rankings
    });

    await msigWallet.transfer({
        destination: staking.address,
        value: convertCrystal(1, 'nano'),
        flags: operationFlags.FEE_FROM_CONTRACT_BALANCE,
        bounce: true,
        payload: payload
    });

    console.log(await staking.rankings());
}

main().then(
    () => process.exit()
).catch(
    (err) => {
        console.log(err);
    }
)