const { libNode } = require("@tonclient/lib-node");
const { Account } = require("@tonclient/appkit");
const crypto = require('crypto');
const { SimpleWalletContract } = require('../artifacts/SimpleWalletContract.js');
const { LighthouseContract } = require('../artifacts/LighthouseContract.js');
const { TonClient, signerNone, signerKeys, signerExternal, abiContract,
    builderOpInteger, builderOpCell, builderOpCellBoc, builderOpBitString } = require("@tonclient/core");
const { constructContracts, getLighthouseAddress } = require('./common.js')
const fs = require('fs');
const path = require('path');
const config = require('./config');
import { main as finelizeLiability } from './tests/finalizeLiability';

const keysFile = path.join(__dirname, '/keys.json');

const PythonShell = require('python-shell').PythonShell;


(async () => {
    TonClient.useBinaryLibrary(libNode);
    const client = new TonClient({
        network: {
            endpoints: config['network']['endpoints'],
        }
    });
    console.log("Hello TON!");

    const keys = JSON.parse(fs.readFileSync(keysFile, "utf8"));
    const simpleWallet = new Account(SimpleWalletContract, {signer: signerKeys(keys), client: client, initData: {nonce: 0} });
    const { root, xrt } = await constructContracts(client, keys)
    const lighthouse = new Account(LighthouseContract, { address: await getLighthouseAddress(client, root, xrt, 'Lighthouse'), client: client })


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
            liabilityHash = decoded.value.liabilityHash;
            console.log("New liability. Hash: ", liabilityHash);
            liabilityBoc = (await lighthouse.runLocal('getLiabilityByHash', {
                liabilityHash: liabilityHash
            })).decoded.output.value0;
            console.log(liabilityBoc);
            decodedLiability = (await client.abi.decode_boc({
                params: [
                    {
                        name: "model",
                        type: "string"
                    },
                    {
                        name: "objective",
                        type: "string"
                    },
                    {
                        name: "cost",
                        type: "uint128"
                    },
                    {
                        name: "token",
                        type: "address"
                    },
                    {
                        name: "penalty",
                        type: "uint128"
                    },
                    {
                        name: "validatorContract",
                        type: "optional(address)"
                    },
                    {
                        name: "validatorPubkey",
                        type: "optional(uint256)"
                    }
                ],
                boc: liabilityBoc,
                allow_partial: true       
            })).data;
            console.log(decodedLiability);
            if (decodedLiability.objective == 'Launch') {
                console.log('Launch');
                PythonShell.run('rover.py', null, function (err) {
                    console.log('finished');
                    finelizeLiability(client, liabilityHash);
                });
            }
        }
    });

    await new Promise((resolve) => setTimeout(resolve,300000));
    await client.net.unsubscribe(subscription);
})(); 