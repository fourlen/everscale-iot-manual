const assert = require("assert");

const { TonClient, signerNone, signerKeys, signerExternal, abiContract,
  builderOpInteger, builderOpCell, builderOpCellBoc, builderOpBitString } = require("@tonclient/core");
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

const u = (size, x) => {
    if (size === 256) {
        return builderOpBitString(`x${BigInt(x).toString(16).padStart(64, "0")}`)
    } else {
        return builderOpInteger(size, x);
    }
}
const u8 = x => u(8, x);
const u32 = x => u(32, x);
const u64 = x => u(64, x);
const u128 = x => u(128, x);
const u256 = x => u(256, x);
const b0 = u(1, 0);
const b1 = u(1, 1);
const bits = x => builderOpBitString(x);
const bytes = x => builderOpCell([bits(x.toString("hex"))]);
const str = x => bytes(Buffer.from(x, "utf8"));
const addrStdFixed = (x) => {
    let parts = x.split(":");
    const wid = parts.length < 2 ? "00" : Number.parseInt(parts[0]).toString(16).padStart(2, "0");
    const addr = parts[parts.length < 2 ? 0 : 1].padStart(64, "0");
    return bits(`${wid}${addr}`);
};
const addrInt = (x) => {
    let parts = x.split(":");
    let [wid, addr] = parts.length < 2 ? ["0", parts[0]] : parts;
    wid = Number.parseInt(wid).toString(2).padStart(8, "0");
    addr = BigInt(`0x${addr}`).toString(2).padStart(256, "0");
    return bits(`n100${wid}${addr}`);
};

async function signHash(client, hash, keys) {
    const data = Buffer.from(hash, 'hex').toString('base64')
    const signature = (await client.crypto.sign({ unsigned: data, keys: keys})).signature
    return (await client.boc.encode_boc({
        builder: [
            builderOpBitString('x' + signature)
        ]
    })).boc;
}

async function finalizeLiability(client, liabilityHash, result) {
    const keys = JSON.parse(fs.readFileSync(keysFile, "utf8"));
    const simpleWallet = new Account(SimpleWalletContract, {signer: signerKeys(keys), client: client, initData: {nonce: 0} });
    const { root, xrt } = await constructContracts(client, keys)
    const lighthouse = new Account(LighthouseContract, { address: await getLighthouseAddress(client, root, xrt, 'Lighthouse'), client: client })

    // now it is taken from CL agruments
    //const liabilityHash = '0x29ee761d95c64705e87e3e4dde9b120da26c8c24c690e65307dadfbe03c92a52'

    const dataCell = (await client.boc.encode_boc({
        builder: [
            bytes(Buffer.from(result)),
            u256(liabilityHash),
            b1,
            addrInt(await root.getAddress())
        ]
    })).boc;
    const dataHash = Buffer.from((await client.boc.get_boc_hash({boc : dataCell})).hash, 'hex')

    const signature = await signHash(client, dataHash, keys)

    message = (await client.abi.encode_message_body({
        abi: abiContract(LighthouseContract.abi),
        call_set: {
            function_name: 'finalizeLiability',
            input: {
                dataCell: dataCell,
                signature: signature
            }
        },
        is_internal: true,
        signer: signerNone()
    }))['body'];

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

    res = await simpleWallet.run('sendMessage', {dest : await lighthouse.getAddress(),
                                                 value: 10_000_000_000,
                                                 mode: 0,
                                                 bounce: true,
                                                 payload: message});

    /*res = await lighthouse.runLocal('createLiability', {
        demandCell : demandCell,
        customerSignature : customerSignature,
        offerCell : offerCell,
        executorSignature: executorSignature
    });
    console.log(res)*/

    const res_balance = await lighthouse.runLocal('balances', {})
    console.log(res_balance.decoded.output.balances)
    const res_stakes = await lighthouse.runLocal('stakes', {})
    console.log(res_stakes.decoded.output.stakes)
    res = await lighthouse.runLocal('currentQuota', {})
    console.log(res.decoded.output.currentQuota)
}

module.exports = {
    finalizeLiability
}

// (async () => {
//     try {
//         TonClient.useBinaryLibrary(libNode);
//         const client = new TonClient({
//             network: {
//                 endpoints: config['network']['endpoints'],
//             }
//         });
//         console.log("Hello TON!");
//         if (process.argv.length < 3) {
//             console.log('Please specify liability hash as CLI agrument')
//             process.exit(1);
//         }
//         await finalizeLiability(client, process.argv[2]);
//         process.exit(0);
//     } catch (error) {
//         console.error(error);
//     }
// })();
