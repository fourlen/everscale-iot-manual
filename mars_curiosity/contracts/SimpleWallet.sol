pragma ton-solidity >= 0.42.0;

contract SimpleWallet {
  uint64 static public nonce;

  constructor() public {
      tvm.accept();
  }

  function sendMessage(address dest, uint128 value, uint16 mode, bool bounce, TvmCell payload) external {
      require(msg.pubkey() == tvm.pubkey());
      tvm.accept();
      dest.transfer({value: value, bounce: bounce, flag: mode, body: payload});
  }

}
