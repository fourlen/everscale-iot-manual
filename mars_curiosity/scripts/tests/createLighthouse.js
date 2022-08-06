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

    /*const accountSubscription = await client.net.subscribe_collection({
        collection: "accounts",
        filter: { id: { eq: await simpleWallet.getAddress() } },
        result: "balance",
    }, (params, responseType) => {
        console.log("Root has updated. Current balance is ", parseInt(params.result.balance));
    });*/

    const messageSubscription = await client.net.subscribe_collection({
        collection: "messages",
        filter: {
            src: { eq: await root.getAddress() },
        },
        result: "id, src, dst, msg_type, value, boc, body",
    }, async (params, responseType) => {
        if (params.result.msg_type == 2) {
          const decoded = (await client.abi.decode_message({
                    abi: abiContract(RootContract.abi),
                    message: params.result.boc,
                }));
          console.log('>>> ', Buffer.from(decoded.value.name, 'hex').toString());
        }
    });

    console.log(await simpleWallet.getAddress(), await root.getAddress())

    const message = (await client.abi.encode_message_body({
        abi: abiContract(RootContract.abi),
        call_set: {
            function_name: 'createLighthouse',
            input: {
                _answer_id : 0,
                lighthouseCode : LighthouseContract.code,
                value : 2_000_000_000,
                params: {
                  valuePerQuota : 1,
                  timeout : 1000,
                },
                name : Buffer.from('Lighthouse').toString('hex')
            }
        },
        is_internal: true,
        signer: signerNone()
    }))['body'];

    const res = await simpleWallet.run('sendMessage', {dest : await root.getAddress(),
                                                       value: 10_000_000_000,
                                                       mode: 0,
                                                       bounce: true,
                                                       payload: message});

    //console.log(`Lighthouse was created`, res)
    console.log(parseInt(await root.getBalance()) / 1e9, parseInt(await simpleWallet.getBalance()) / 1e9)
    //await client.net.unsubscribe(accountSubscription);
    //await client.net.unsubscribe(messageSubscription);

    for (var address in (await root.runLocal('isLighthouse', {})).decoded.output.isLighthouse) {
        const lighthouse = new Account(LighthouseContract, { address : address, client: client })
        const name = Buffer.from((await lighthouse.runLocal('name', {})).decoded.output.name, 'hex').toString()
        const expected_lighthouse = await getLighthouseAddress(client, root, xrt, name)
        assert(address == await expected_lighthouse)
        console.log(address, name)
    }
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
