// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract MLR
{
    struct Node
    {
        address parent; 
        address user;
    }

    mapping(address=>uint256) public map; //pairs a user's address with their index in the users array.
    mapping(address=>uint256) public rewards; //pairs a user's address with their rewards.

    Node[] public users;
    address public owner;
    address public company;

    constructor()
    {
        users.push(Node(address(0),address(0))) ;
        owner=msg.sender;
        company=address(0);
    }

    modifier onlyOwner
    {
        require(msg.sender==owner,'Ownable: caller is not the owner');
        _;
    }
    
    function addRoot(address _superConnector) onlyOwner public
    {
        users.push(Node(_superConnector,_superConnector)) ;
        map[_superConnector]=users.length-1;
    }

    function setCompanyAddress(address _company) onlyOwner public
    {
        company=_company;
    }

    function getUsersLength() onlyOwner public view returns(uint256)
    {
        return users.length;
    }

    function getCompany() onlyOwner public view returns(address)
    {
        return company;
    }

    function getRewardsInGwei(address _user) onlyOwner public view returns(uint256)
    {
        return (rewards[_user]/1000000000);
    }

    function Buy(address _parent) public payable 
    {
        require(map[_parent]!=0,"The address you are giving isn't a referrer's :)");
        require(msg.value>0,"Please send some ether :)");
        require(_parent!=msg.sender,"You can't refer to yourself :)");

        users.push(Node(_parent,msg.sender)); //adding the node to the tree.
        map[msg.sender]=users.length-1; //associating the index of the node with the address of the user.length;

        uint256 numberOfParents=1;
        address parent1=_parent ;
        address parent2=address(0) ;
        uint256 idxParent1=map[_parent] ;

        uint256 parentShare=msg.value*3/100 ;

        if (users[idxParent1].parent!=parent1)
        {
            numberOfParents=2 ;
            parent2=users[idxParent1].parent ;
        }

        if (numberOfParents==2)
        {
            uint companyShare=msg.value-(parentShare*2) ;
            payable(parent1).transfer(parentShare) ;
            payable(parent2).transfer(parentShare) ;
            payable(company).transfer(companyShare) ;
            rewards[parent1] = rewards[parent1]+parentShare ;
            rewards[parent2] = rewards[parent2]+parentShare ;
        }
        else
        {
            uint companyShare=msg.value-(parentShare) ;
            payable(parent1).transfer(parentShare) ;
            payable(company).transfer(companyShare) ;
            rewards[parent1]=rewards[parent1]+parentShare ;
        }//The number of parents is either 1 or 2, no third option.
    }
}