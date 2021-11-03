const initializeLocklift = require('../../utils/initializeLocklift');
const configuration = require('../../scripts.conf');
const { loadContractData, writeContractData } = require('../../utils/migration/manageContractData');

async function main() {
    let locklift = await initializeLocklift(configuration.pathToLockliftConfig, configuration.network);
    let staking = await locklift.factory.getContract('Staking', configuration.buildDirectory);
    let msigWallet = await loadContractData(locklift, configuration, `${configuration.network}_MsigWallet.json`);

    if (configuration.network != 'local') {
        console.log(await locklift.ton.createDeployMessage({
            contract: staking,
            constructorParams: {
                _owner: msigWallet.address
            },
            initParams: {},
            keyPair: msigWallet.keyPair,
        }));

        const {
            address,
        } = await locklift.ton.createDeployMessage({
            contract: staking,
            constructorParams: {
                _owner: msigWallet.address
            },
            initParams: {},
            keyPair: msigWallet.keyPair,
        });

        const message = await locklift.ton.createDeployMessage({
            contract: staking,
            constructorParams: {
                _owner: msigWallet.address
            },
            initParams: {},
            keyPair: msigWallet.keyPair,
        });

        await locklift.ton.waitForRunTransaction({ message, abi: staking.abi });

        staking.setAddress(address);
    } else {

        await locklift.giver.deployContract({
            contract: staking,
            constructorParams: {
                _owner: msigWallet.address
            },
            initParams: {},
            keyPair: msigWallet.keyPair
        });
    }

    await writeContractData(staking, `Staking.json`);
}

main().then(
    () => process.exit(0)
).catch(
    (err) => {
        console.log(err);
        process.exit(1);
    }
)