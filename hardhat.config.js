require("@nomicfoundation/hardhat-toolbox");
require("hardhat-gas-reporter");

/** @type import('hardhat/config').HardhatUserConfig */

module.exports = {
  solidity: "0.8.19",
  gasReporter:
  {
    enabled: true,
    //outputFile: "gas-report.txt",
    //noColors: true,
    currency: "USD",
    coinmarketcap:"d7328133-08d9-4734-9b70-0ec7bc8cc1ad",
    token: "MATIC",
  },
};
