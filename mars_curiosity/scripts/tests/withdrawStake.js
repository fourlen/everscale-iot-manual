const assert = require("assert");

const { TonClient, signerNone, signerKeys, signerExternal, abiContract } = require("@tonclient/core");
const { Account } = require("@tonclient/appkit");
const { libNode } = require("@tonclient/lib-node");

const fs = require('fs');
const path = require('path');
const keysFile = path.join(__dirname, '../keys.json');

const { get_tokens_from_giver } = require('../giverConfig.js')

const config = require('../config');

const { LighthouseContract } = require('../../artifacts/LighthouseContract.js');
const { RootContract } = require('../../artifacts/RootContract.js');
const { XRTContract } = require('../../artifacts/XRTContract.js');
const { SimpleWalletContract } = require('../../artifacts/SimpleWalletContract.js')

const { constructContracts, getLighthouseAddress } = require('../common.js')

async function main(client) {
    const keys = JSON.parse(fs.readFileSync(keysFile, "utf8"));
    const simpleWallet = new Account(SimpleWalletContract, {signer: signerKeys(keys), client: client, initData: {nonce: 0} });
    const { root, xrt } = await constructContracts(client, keys)
    const lighthouse = new Account(LighthouseContract, { address: await getLighthouseAddress(client, root, xrt, 'Lighthouse'), client: client })

    console.log(await simpleWallet.getAddress())

    const messageSubscription = await client.net.subscribe_collection({
        collection: "messages",
        filter: {
            src: { eq: await lighthouse.getAddress() },
        },
        result: "id, src, dst, msg_type, value, boc, body",
    }, async (params, responseType) => {
        if (params.result.msg_type == 2) {
          const decoded = (await client.abi.decode_message({
                    abi: abiContract(LighthouseContract.abi),
                    message: params.result.boc,
                }));
          console.log('>>> ', decoded);
        }
    });

    var message = (await client.abi.encode_message_body({
        abi: abiContract(LighthouseContract.abi),
        call_set: {
            function_name: 'withdrawStake',
            input: {
                'stake' : 0
            }
        },
        is_internal: true,
        signer: signerNone()
    }))['body'];

    res = await simpleWallet.run('sendMessage', {dest : await lighthouse.getAddress(),
                                                 value: 10_000_000_000,
                                                 mode: 0,
                                                 bounce: true,
                                                 payload: message});
    console.log(parseInt(await simpleWallet.getBalance()) / 1e9,
               parseInt(await xrt.getBalance()) / 1e9,
               parseInt(await lighthouse.getBalance()) / 1e9)

    const res_balance = await lighthouse.runLocal('balances', {})
    console.log(res_balance.decoded.output.balances)
    const res_stakes = await lighthouse.runLocal('stakes', {})
    console.log(res_stakes.decoded.output.stakes)
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
