pragma ton-solidity >= 0.45.0;

// they don't support storing large structures via builder and decoding via slice, so we need to implement it manually
library DOParamsCoding {
  function decodeDOParams(TvmSlice slice) internal returns (DOParams) {
    DOParams res;

    res.model = slice.decode(bytes); // stored in separate ref
    res.objective = slice.decode(bytes); // stored in separate ref
    res.cost = slice.decode(uint128);
    res.token = slice.decode(address);
    res.penalty = slice.decode(uint128);
    slice = slice.loadRefAsSlice();
    res.validatorContract = slice.decode(optional(address));
    res.validatorPubkey = slice.decode(optional(uint256));

    return res;
  }

  function decodeDemandParams(TvmSlice slice) internal returns (DemandParams) {
    DemandParams res;

    res.terms = decodeDOParams(slice.loadRefAsSlice());
    res.isDemand = slice.decode(bool);
    res.lighthouse = slice.decode(address);
    res.customerAddress = slice.decode(address);
    res.customerPubkey = slice.decode(uint256);
    slice = slice.loadRefAsSlice();
    res.nonce = slice.decode(uint64);
    res.deadline = slice.decode(uint32);
    res.validatorFee = slice.decode(uint128);

    return res;
  }

  function decodeOfferParams(TvmSlice slice) internal returns (OfferParams) {
    OfferParams res;

    res.terms = decodeDOParams(slice.loadRefAsSlice());
    res.isDemand = slice.decode(bool);
    res.lighthouse = slice.decode(address);
    res.executorAddress = slice.decode(address);
    res.executorPubkey = slice.decode(uint256);
    slice = slice.loadRefAsSlice();
    res.nonce = slice.decode(uint64);
    res.deadline = slice.decode(uint32);
    res.providerFee = slice.decode(uint128);

    return res;
  }
}

// Common params of the deal to store
struct DOParams {
  bytes model; // Behaviour model multihash
  bytes objective; // Objective ROSBAGv2 multihash
  uint128 cost; // Liability cost
  address token; // ERC20 token address for payments
  uint128 penalty; // the penalty executor should pay when unable to perform the order

  // Actually Validator = Contract address | Pubkey uint256 | None
  optional(address) validatorContract;
  optional(uint256) validatorPubkey;
}

// signed by customer
struct DemandParams {
  DOParams terms; // common terms of the deal

  bool isDemand; // Is this demmand params or offer params (this flag must be signed as well)
  address lighthouse;
  address customerAddress; // address which owns tokens for payments
  uint256 customerPubkey;
  uint64 nonce;
  uint32 deadline;
  uint128 validatorFee;
}

// signed by executor
struct OfferParams {
  DOParams terms; // common terms of the deal

  bool isDemand; // Is this demmand params or offer params (this flag must be signed as well)
  address lighthouse;
  address executorAddress; // address which owns tokens for payments
  uint256 executorPubkey;
  uint64 nonce;
  uint32 deadline;
  uint128 providerFee;
}

// data needed to be stored
struct Liability {
    DOParams terms; // Liability terms

    uint128 validatorFee;

    uint256 executorPubkey;
    uint256 customerPubkey;

    address executorAddress;
    address customerAddress;
}
