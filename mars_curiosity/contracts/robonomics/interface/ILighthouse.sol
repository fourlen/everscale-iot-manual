pragma ton-solidity >= 0.42.0;

struct LighthouseParams {
  uint128 valuePerQuota; // value needed to be staked to get one quota
  uint32 timeout; // Silence timeout for provider in unixtime
}
