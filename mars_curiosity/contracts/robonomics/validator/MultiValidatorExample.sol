pragma ton-solidity >=0.42.0;

interface ILighthouse {
  function finalizeLiability_validatorContarct(
      bytes result,
      uint256 liabilityHash,
      bool success
  )
      external functionID(11)
      responsible returns (bool);
}

// sample on-chain validator which collects votes on result from predefined off-chain validators and sends the result when there are enough of them
contract Validator {
    event NewProposal(uint32 proposalId, uint8 pubkey_id);
    event NewVote(uint32 proposalId, uint8 cnt, uint8 pubkey_id);
    event ProposalSend(uint32 proposalId);

    address static public lighthouse;
    mapping(uint8 => uint256) static public pubkeys;
    uint8 static public k;

    struct Proposal {
        bytes result;
        uint256 liabilityHash;
        bool success;
        uint256 mask;
        uint8 cnt;
    }
    mapping(uint32 => Proposal) proposals;

    constructor() public {
        tvm.accept();
    }

    function addProposal(uint8 pubkey_id, TvmCell dataCell, TvmCell signature) external {
        require(msg.sender == address(0)); // only external messages
        uint256 pubkey = pubkeys.at(pubkey_id);
        TvmSlice data = dataCell.toSlice();
        address validator = data.decode(address);
        require(validator == address(this)); // cross-contract reply protection
        require(tvm.checkSign(tvm.hash(dataCell), signature.toSlice(), pubkey));
        tvm.accept();

        (uint32 proposalId, bytes result, uint256 liabilityHash, bool success) = data.decode(uint32, bytes, uint256, bool);

        require(!proposals.exists(proposalId));
        Proposal proposal;
        proposal.result = result;
        proposal.liabilityHash = liabilityHash;
        proposal.success = success;
        proposal.mask = (uint256(1) << pubkey_id);
        proposal.cnt = 1;

        if (k == 1) {
            sendProposal(proposal, proposalId);
        }
        else {
            proposals[proposalId] = proposal;
            emit NewProposal(proposalId, pubkey_id);
        }
    }

    function signProposal(uint8 pubkey_id, TvmCell dataCell, TvmCell signature) external {
        require(msg.sender == address(0));
        uint256 pubkey = pubkeys.at(pubkey_id);
        (address validator, uint32 proposalId) = dataCell.toSlice().decode(address, uint32);
        require(validator == address(this)); // cross-contract reply protection
        require(tvm.checkSign(tvm.hash(dataCell), signature.toSlice(), pubkey));
        tvm.accept();

        Proposal proposal = proposals.at(proposalId);
        if ((proposal.mask & (uint256(1) << pubkey_id)) == 0) {
             proposal.mask |= (uint256(1) << pubkey_id);
             proposal.cnt += 1;

             if (proposal.cnt >= k) {
                sendProposal(proposal, proposalId);
                delete proposals[proposalId];
             }
             else {
                proposals[proposalId] = proposal;
                emit NewVote(proposalId, proposal.cnt, pubkey_id);
             }
        }
    }

    function finalized(bool res) external {
        require(msg.sender == lighthouse);
        if (res) {
            selfdestruct(address(0));
        }
    }

    function sendProposal(Proposal proposal, uint32 proposalId) internal {
        emit ProposalSend(proposalId);
        ILighthouse(lighthouse).finalizeLiability_validatorContarct{value: 0, flag: 128, callback: Validator.finalized}(
            proposal.result,
            proposal.liabilityHash,
            proposal.success
        );
    }
}
