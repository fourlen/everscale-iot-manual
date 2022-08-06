pragma ton-solidity >=0.42.0;

import "../IERC20.sol";

/**
 * @dev Interface for the optional metadata functions from the ERC20 standard.
 *
 * _Available since v4.1._
 */
interface IERC20Metadata is IERC20 {
    /**
     * @dev Returns the name of the token.
     */
    function name() external view responsible returns (string);

    /**
     * @dev Returns the symbol of the token.
     */
    function symbol() external view responsible returns (string);

    /**
     * @dev Returns the decimals places of the token.
     */
    function decimals() external view responsible returns (uint8);
}
