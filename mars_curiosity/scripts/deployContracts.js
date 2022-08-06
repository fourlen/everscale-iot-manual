const { exec } = require('child_process');

const { TonClient, signerKeys, signerNone, abiContract } = require("@eversdk/core");
const { Account } = require("@eversdk/appkit");
const { libNode } = require("@eversdk/lib-node");

const { get_tokens_from_giver } = require('./giverConfig.js')

const fs = require('fs');
const path = require('path');
const keysFile = path.join(__dirname, 'keys.json');

const config = require('./config');

const { LighthouseContract } = require('../artifacts/LighthouseContract.js');
const { RootContract } = require('../artifacts/RootContract.js');
const { XRTContract } = require('../artifacts/XRTContract.js');

const { constructContracts } = require('./common.js')


async function main(client) {
    const keys = JSON.parse(fs.readFileSync(keysFile, "utf8"));

    const { root, xrt } = await constructContracts(client, keys)

    console.log(`Future root address will be ${await root.getAddress()}`)
    console.log(`Future xrt address will be ${await xrt.getAddress()}`)

    console.log(`Asking giver to transfer some funds...`)
    await get_tokens_from_giver(client, await root.getAddress(), 10)
    await get_tokens_from_giver(client, await xrt.getAddress(), 10)
    console.log(`Succeed`)

    console.log(`Deploying xrt...`)
    await xrt.deploy();
    console.log(`Deploying root...`)

    if (config['network']['type'] == 'test') {
      const { SimpleWalletContract } = require('../artifacts/SimpleWalletContract.js')
      for (var i = 0; i < 3; i++) {
          const simpleWallet = new Account(SimpleWalletContract, {signer: signerKeys(keys), client: client, initData: {nonce: i}});
          config['toMint'].push({to : (await simpleWallet.getAddress()), value: 500_000_000_000})
      }
    }

    await root.deploy({ initInput: {'_xrt' : await xrt.getAddress(), 'toMint' : config['toMint']}});

    console.log(`All contracts were deployed`)
}

(async () => {
    try {
        TonClient.useBinaryLibrary(libNode);
        const client = new TonClient({
            network: {
                endpoints: config['network']['endpoints'],
            }
        });
        console.log("Hello TON!");
        await main(client);
        process.exit(0);
    } catch (error) {
        console.error(error);
    }
})();
