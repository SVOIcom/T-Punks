pragma ton-solidity >= 0.43.0;

struct Punk {
    uint32 id;
    string punkType;
    string attributes;
    uint32 rank; 
}

struct SellPunk {
    uint128 price;
    address owner;
}

interface IPunk {
    function uploadToken(Punk[] punkInfo) external;

    function startSell() external;
    

    function mintToken(address referal) external view;

    function _mintToken(address mintTo, uint32 amountLeftToMint, uint32 originalTokenAmount) external;

    function _payoutReferal(address receiver, uint128 valueToTransfer) external pure;


    function transferTokenTo(uint32 tokenID, address receiver) external;


    function setForSale(uint32 tokenID, uint128 tokenPrice) external;

    function setAsNotForSale(uint32 tokenID) external;

    function buyToken(uint32 tokenID) external;
    

    function setBuyPrice(uint128 priceForSale_) external;

    function setReferalParams(uint128 refNom, uint128 refDenom) external;

    function withdrawExtraTons(uint128 tonsToWithdraw) external view;


    function getOwnerOf(uint32 tokenID) external responsible view returns(address);

    function getAllNfts() external responsible view returns(mapping(uint32 => Punk));

    function getUserNfts(address collector) external responsible view returns(mapping(uint32 => bool));

    function getNft(uint32 nftID) external responsible view returns(Punk, address collector);

    function getTokenSupplyInfo() external responsible view returns(uint32 mintedTokens, uint32 notMintedTokens);

    function getTokenPrice() external responsible view returns(uint128);

    function getReferalParams() external responsible view returns (uint128, uint128);

    function getAllTokensForSale() external responsible returns(mapping(uint32 => SellPunk));

    function getSellInfo(uint32 tokenID) external responsible returns(SellPunk);


    event PunkMinted(
        uint32 punkId,
        address mintedBy,
        uint128 price,
        uint64 mintTime
    );

    event PunkTransferred(
        uint32 punkId,
        address from,
        address to,
        uint64 transferTime
    );

    event PunkSold(
        uint32 punkId,
        address from,
        address to,
        uint64 sellTime
    );
}

interface ITPunksCallbacks {
    function transferNFTToContract(address contractAddress, uint32 punkId, TvmCell payload) external;
    function transferNFTFromContract(address receiver, uint32 punkId, TvmCell payload) external;
}

interface INFTReceiver {
    function receiveNFT(address _staker, Punk _punk, TvmCell payload) external;
}