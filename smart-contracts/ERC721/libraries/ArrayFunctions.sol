pragma ton-solidity >= 0.43.0;

library ArrayFunctions {
    function findIndex(uint32[] array, uint32 value) internal pure returns(uint32) {
        uint32 index = 0;
        for (uint32 element : array) {
            if (element == value) {
                break;
            }
            index++;
        }
        return index;
    }
}