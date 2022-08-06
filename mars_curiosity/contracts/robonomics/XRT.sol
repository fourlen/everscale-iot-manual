pragma ton-solidity >=0.42.0;

import '../ERC20/ERC20.sol';


//XRT is a ERC20 token that used to pay robots 


contract XRT is ERC20 {
    address static public root; //root is a person who can mint XRT, create lighthouses

    modifier returnsChange() {
        tvm.rawReserve(address(this).balance - msg.value, 0);  //reserves extra EVERs
        _;  //code goes here
        msg.sender.transfer({value: 0, flag: 128}); //transfers the reserved EVERs (flag 128 means to send all tokens from this contract)
    }

    function decimals() public view override responsible returns (uint8) {
        return 9;   //min value is 0.000000001 XRT
    }                              //   9      decimals

    constructor() public {
        tvm.accept();
    }

    function mint(address to, uint128 amount) external returnsChange {
        require(msg.sender == root);
        _mint(to, amount);             //mints XRT, only available for root
    }
}
