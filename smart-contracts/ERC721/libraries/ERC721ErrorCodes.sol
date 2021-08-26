pragma ton-solidity >= 0.43.0;

library ERC721ErrorCodes {
    uint32 constant ERROR_MSG_SENDER_IS_NOT_OWNER = 100;
    uint32 constant ERROR_SALE_IS_NOT_STARTED = 101;
    uint32 constant ERROR_NO_TOKENS_LEFT = 102;
    uint32 constant ERROR_MSG_VALUE_IS_TOO_LOW = 103;
    uint32 constant ERROR_MSG_SENDER_IS_NOT_NFT_OWNER = 104;
}