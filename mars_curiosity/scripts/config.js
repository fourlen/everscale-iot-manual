module.exports = {
    toMint : [/*{'to' : '0:a95191fe91f13cb357aaaba6bc1a4aa0479dd67f85d523d2cb4d855c4dd6fcea', 'value' : 500_000_000_000}*/
             ], // XRTs to mint initially
    network : {
      // Specify 127.0.0.1 if you have TON OS SE instance running locally
      // see https://docs.ton.dev/86757ecb2/p/641c22-platforms for more info
      endpoints : ["127.0.0.1"], // nodes to access the network
      type : "test" // is this test or main network
    }
}
