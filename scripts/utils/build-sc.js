const { execSync } = require('child_process');
const configuration = require('../scripts.conf');

const srcDir = './smart-contracts'
const contracts = [
    'Staking/Staking',
]

async function main() {
    for (let scName of contracts) {
        let fullName = `${srcDir}/${scName}.sol`;
        let contractName = scName.replace(/.*\//, '');
        try {
            execSync(`tondev sol compile -o ${configuration.buildDirectory} ${fullName}`);
            if (process.platform== 'linux') {
                    execSync(`base64 < ${configuration.buildDirectory}/${contractName}.tvc > ${configuration.buildDirectory}/${contractName}.base64`);
            } else if (process.platform == 'win32') {

            }
            console.log(`Contract ${contractName} builded. Build files are in ${configuration.buildDirectory}`);
        } catch (err) {
            console.error(`Contract ${contractName} (${fullName}) build FAILED`);
            console.error(`Use command:`);
            console.error(`tondev sol compile -o ${configuration.buildDirectory} ${fullName}`);
            console.error(`For more details on error`);
        }
    }
}

main().then(
    () => process.exit(0)
).catch(
    (err) => {
        console.log(err);
        process.exit(1);
    }
)