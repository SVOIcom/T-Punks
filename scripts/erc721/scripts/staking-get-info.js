const initializeLocklift = require('../../utils/initializeLocklift');
const configuration = require('../../scripts.conf');
const { loadContractData, writeContractData } = require('../../utils/migration/manageContractData');
const { Staking } = require('../modules/staking');
const { convertCrystal } = require('locklift/locklift/utils');
const { operationFlags } = require('../../utils/transferFlags');
const { MsigWallet, extendContractToWallet } = require('../../wallet/modules/walletWrapper');

const fs = require('fs');

async function main() {

    let locklift = await initializeLocklift(configuration.pathToLockliftConfig, configuration.network);
    let staking = new Staking(await loadContractData(locklift, configuration, `${configuration.network}_Staking.json`));
    /**
     * @type {MsigWallet}
     */
    let msigWallet = await loadContractData(locklift, configuration, `${configuration.network}_MsigWallet.json`);
    msigWallet = extendContractToWallet(msigWallet)

    console.log(await staking.rankings());

    const output = JSON.stringify(await staking.ownerInfo(), null, '\t');
    
    fs.writeFileSync('./output.json', output);

    console.log();

    console.log(await staking.pools());

    console.log(String(await staking.getUserReward({
        _user: '0:c1f2b2941fe3ed16960c484db49186363ed4bbb7c825a8128f46d787f973ff2b',
        _poolId: 1
    })));
}

main().then(
    () => process.exit()
).catch(
    (err) => {
        console.log(err);
    }
)