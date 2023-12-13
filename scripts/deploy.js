const hre = require("hardhat");

async function main()
{
    const mlr = await hre.ethers.deployContract("MLR");
    await mlr.waitForDeployment();
}

main().catch((error) =>
{
    console.error(error);
    process.exitCode = 1;
});


// To deploy: npx hardhat run --network localhost scripts/deploy.js