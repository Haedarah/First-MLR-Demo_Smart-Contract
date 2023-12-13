const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("-- MLR Contract --", function ()
{
    let owner;
    let company;
    let add1 ;
    let add2 ;
    let add3 ;
    let add4 ;
    let mlrContract;

    beforeEach(async () =>
    {
        [owner,add1,add2,add3,add4,company] = await ethers.getSigners();
        // Deploy the MLR contract
        const MLRContract = await ethers.getContractFactory("MLR");
        mlrContract = await MLRContract.deploy();
    
        // Retrieve initial state
        //company = await mlrContract.company();
    });

    describe("-[General] :", function ()
    {
        it("Should have the correct owner", async function ()
        {
            expect(await mlrContract.owner()).to.equal(owner.address);
        });

        it("Should have users array size 1 with empty addresses as the first element's parent and child", async function ()
        {
            const usersCount = await mlrContract.getUsersLength();
            expect(usersCount).to.equal(1);
        
            const rootNode = await mlrContract.users(0);
            expect(rootNode.parent).to.equal("0x0000000000000000000000000000000000000000");
            expect(rootNode.user).to.equal("0x0000000000000000000000000000000000000000");
        });

        it("Should return the right company address", async function ()
        {
            const usersCount = await mlrContract.getUsersLength();
            expect(usersCount).to.equal(1);
        
            const rootNode = await mlrContract.users(0);
            expect(rootNode.parent).to.equal("0x0000000000000000000000000000000000000000");
            expect(rootNode.user).to.equal("0x0000000000000000000000000000000000000000");
        });
    });
    
    describe("-Function[addRoot] :", function ()
    {
        it("Should allow the owner to call", async function ()
        {
            await mlrContract.connect(owner).addRoot(add1.address);
            const addedRoot = await mlrContract.users(1);
            expect(addedRoot.parent).to.equal(add1.address);
            expect(addedRoot.user).to.equal(add1.address);
        });
        
        it("Should not allow a non-owner to call", async function ()
        {
            await expect(mlrContract.connect(add1).addRoot(add2.address)).to.be.revertedWith(
            "Ownable: caller is not the owner"
            );
        });
    });

    describe("-Function[setCompanyAddress] :", function ()
    {
        it("Should allow the owner to call", async function ()
        {
            await mlrContract.connect(owner).setCompanyAddress(company.address);
            const settedCompany = await mlrContract.getCompany();
            expect(settedCompany).to.equal(company.address);
        });
        
        it("Should not allow a non-owner to call", async function ()
        {    
        await expect(mlrContract.connect(add1).setCompanyAddress(company.address)).to.be.revertedWith(
            "Ownable: caller is not the owner"
        );
        });
    });

    describe("-Function[Buy] :", function ()
    {
        it("Should revert if the specified parent address is not a referrer's address", async function ()
        {
            await expect(mlrContract.connect(add1).Buy(owner.address, {value:1})).to.be.revertedWith("The address you are giving isn't a referrer's :)");
        });
        
        it("Should revert if the transaction value is not greater than 0", async function ()
        {
            mlrContract.connect(owner).addRoot(add1.address);//Adding a root(address1)
            await expect(mlrContract.connect(add2).Buy(add1, {value:0})).to.be.revertedWith("Please send some ether :)");
        });
        
        it("Should revert if the user is referring to themselves", async function ()
        {
            mlrContract.connect(owner).addRoot(add1.address);//Adding a root(address1)
            await expect(mlrContract.connect(add1).Buy(add1.address, {value:1})).to.be.revertedWith("You can't refer to yourself :)");
        });
    });

    describe("-Complex Tests :", function ()
    {
        it("Simulation of a referring process - Users Referring Each Other Following The Rules", async function()
        {
            await mlrContract.connect(owner).setCompanyAddress(company.address);//Adding a company (Company)
            const Comp=await mlrContract.getCompany();
            expect(Comp).to.equal(company.address);
            
            await mlrContract.connect(owner).addRoot(add1.address);//Adding a root(address1)
            const add1Node = await mlrContract.users(1);
            expect(add1Node.parent).to.equal(add1.address);
            expect(add1Node.user).to.equal(add1.address);

            await mlrContract.connect(add2).Buy(add1.address,{value:1});//Adding a node through the root
            const add2Node = await mlrContract.users(2);
            expect(add2Node.parent).to.equal(add1.address);
            expect(add2Node.user).to.equal(add2.address);

            await mlrContract.connect(add3).Buy(add2.address,{value:1});//Adding a node through another root
            const add3Node = await mlrContract.users(3);
            expect(add3Node.parent).to.equal(add2.address);
            expect(add3Node.user).to.equal(add3.address);

            await mlrContract.connect(add4).Buy(add3.address,{value:1});//Adding a node through another root
            const add4Node = await mlrContract.users(4);
            expect(add4Node.parent).to.equal(add3.address);
            expect(add4Node.user).to.equal(add4.address);
        });

        it("Simulation of a referring process - Rewards Distribution System - Testing one node's rewards", async function()
        {
            //We are going to test the root's rewards. The goal of the test is to elaborate 
            //that the root node (and any other node) doesn't get rewards from every node in the tree, 
            //only from nodes within 2 layers of it.
            

            await mlrContract.connect(owner).setCompanyAddress(company.address);//Adding a company (Company)
            const Comp=await mlrContract.connect(owner).getCompany();
            expect(Comp).to.equal(company.address);

            await mlrContract.connect(owner).addRoot(add1.address);//Adding a root(address1)
            const add1Node = await mlrContract.connect(owner).users(1);
            expect(add1Node.parent).to.equal(add1.address);
            expect(add1Node.user).to.equal(add1.address);
            //Adding the root to the tree won't give the root a reward. Let's check:
            const current_rewards_1=Number(await mlrContract.connect(owner).getRewardsInGwei(add1Node.user));
            expect(current_rewards_1).to.equal(0); 
        
            await mlrContract.connect(add2).Buy(add1.address,{value:100000000000});//Adding a node through the root
            const add2Node = await mlrContract.connect(owner).users(2);
            expect(add2Node.parent).to.equal(add1.address);
            expect(add2Node.user).to.equal(add2.address);
            //This user got referred by the node immediately (layer1), so the node will get some rewards for that.
            const current_rewards_2=Number(await mlrContract.connect(owner).getRewardsInGwei(add1Node.user));
            expect(current_rewards_2).to.not.equal(current_rewards_1); 

            await mlrContract.connect(add3).Buy(add2.address,{value:100000000000});//Adding a node through the root
            const add3Node = await mlrContract.connect(owner).users(3);
            expect(add3Node.parent).to.equal(add2.address);
            expect(add3Node.user).to.equal(add3.address);
            //This user got referred by the node immediately (layer2), so the node will get some rewards for that.
            const current_rewards_3=Number(await mlrContract.connect(owner).getRewardsInGwei(add1Node.user));
            expect(current_rewards_3).to.not.equal(current_rewards_2); 

            await mlrContract.connect(add4).Buy(add3.address,{value:100000000000});//Adding a node through the root
            const add4Node = await mlrContract.connect(owner).users(4);
            expect(add4Node.parent).to.equal(add3.address);
            expect(add4Node.user).to.equal(add4.address);
            //This user got referred by the node's child's child (layer3), so the node will NOT receive rewards for that.            const current_rewards_2=Number(mlrContract.getRewardsInGwei(add1Node.user));
            const current_rewards_4=Number(await mlrContract.connect(owner).getRewardsInGwei(add1Node.user));
            expect(current_rewards_4).to.equal(current_rewards_3); 
            
         });
    });
});