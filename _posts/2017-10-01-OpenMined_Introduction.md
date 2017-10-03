---
layout: article
title: OpenMined Introduction
coverPhoto: /assets/posts/2017-10-01/openmined-logo.png
---

Data is now collected everywhere, from every device. This data is allowing IT departments and organizations to exploit exploit information about consumers and give business users access to platforms and dashboards which, when used properly, inform decision making, generate sales leads and uncover opportunities. This is made possible by the power of artificial inteligence (AI) and machine learning (ML)

There are three necessary ingredients for AI/ML:
1. data
2. compute power
3. machine learning

Data availability is a barrier for entry to most small to medium size organizations however. Many simply don't have access to the large datasets which would allow them to train a model that does something useful or so that they may sell the use of that model. OpenMined is an open-sourced project for distributed machine learning model training and democratizing access to data.

Most research in machine learning is already publicly available. Open-sourced libraries, research papers and online learning make studying and teaching ML/AI accessible to many people.

Compute power is increasing at an exponential rate (as long as Moore's law holds). Today, with access to managed parallel computing frameworks, it is easy, fast and cost-effective to scale up your companies compute power to handle a broad set of big data use cases.

OpenMined is built to use blockchain technology, smart contracts and homomorphic encryption. It is a promising technology for distributed access to data and for online training of model parameters or gradients in the cloud. Let's learn how it works.

Homomorphic encryption is the process of encrypting values or data. The encryption algorithm does this in a way that allows the encrypted value to be operated on mathematically. This enables encrypted values to be used in functions while maintaining their state of encryption. A system can perform computations on encrypted data without the operator ever actually knowing what the data is. In the diagram below, we can see that you can pass encrypted values into a function or even add 2 encrypted values together without the need to decrypt them first.

![Homomorphic encryption]({{ site.url }}/assets/posts/2017-10-01/homomorphic-encryption.png)

Some Homomorphic encryption libraries include:

- C++
    - [sealcrypto](http://sealcrypto.codeplex.com/)
    - [HElib](https://github.com/shaih/HElib)
    - [homomorphic-simon](https://github.com/tlepoint/homomorphic-simon)

- Python -
    - [python-paillier](https://github.com/n1analytics/python-paillier)

- R -
    - [HomomorphicEncryption](http://www.louisaslett.com/HomomorphicEncryption/)

A smart contract is a dataset stored on a blockchain. This contains 3 things. Data (ledgers, events, statistics), state (today's data, today's events), and code (rules for changing state). Code establishes rules for updating the state. Smart contracts have the following properties:

- state and codes around an agreement are constrained
- enforcement of this state is included in the contract

For a guide to smart-contracts as well as understanding the application of this technology more, check out the following link:
[Smart Contracts: The Blockchain Technology That Will Replace Lawyers
](https://blockgeeks.com/guides/smart-contracts/)

The other component of OpenMined is called the blockchain. A Blockchain is a large distributed dataset and it can be imagined as many machines that all have exact copies of the dataset. No one person or actor can edit or delete an entry of the data set. Data may only be added to the blockchain. Since the blockchain is basically a universally agreed upon ledger of transactions, of which each person has a copy, it is extremely difficult to insert or modify code stored in passed transactions. See this great demonstration for more on how blockchain works:

- [Anders blockchain demo](https://anders.com/blockchain/hash.html)

There are other concepts blockchain is built on such as hashing and mining, however I won't go into all of those here. If interested, watch the video at the bottom of this article.

Another key feature of blockchain is that state and code data are stored on the blocks or nodes. The code can execute on state and because the code is deterministic, everyone can agree on what the dataset was and everyone can see what the dataset should be given an updated state. Now there is a shared computation history that lives in the cloud and no one can corrupt it. Programs can run on there own and can't be manipulated

An appropriate business model can be conceived as follows:
1. Acquire data about people
2. Train a model which does something useful
3. Sell the use of that model (the app)

Let's observe a business which we shall call AI Inc. This company can send a model down to Joe, Jane or Jack (individuals) for training. Individual data owners know the model is learning from their data and gradients are being generated in batches. Gradients are then sent back to AI Inc. to slightly improve the model.

A concern is that AI Inc. can learn something about data from gradients, or Joe, Jane and Jack can steal the model. Security issue's like theft of federated data or models is known as differential privacy and it is an open area of research in a field called federated learning.

One solution to this is encryption. Homomorphic encryption can be used to encrypt model and gradients so people can keep data secret but gradients can still be learned. The model is protected from theft and a uniquely trained model can be profitable business IP.

![Overview]({{ site.url }}/assets/posts/2017-10-01/ai-inc.png)

An issue can still be seen where sophisticated backwards calculation can be used to recreate the dataset. AI inc. could write this into their model and it is possible that Joe, Jack or Jane would not be able to see this since the model is encrypted.

Smart contracts can help solve this problem. Data Scientist's at AI Inc. can send some specifications of the model to a smart contract. Joe may then be able to check which model's require his data for training, choose which contract he would like to accept and authorize the training. The model is sent to Joe by the smart contract, his data is used for model training and gradients are sent back to the contract.

Other security issues can be presented with enough scrutiny but keep in mind this is an active field of research and OpenMined has proposed an initial solution for this in Version 1. You can check out the github repository for the project here: https://github.com/OpenMined


Credit for this post is provided to creators of OpenMined and the following intro video:
<iframe width="560" height="315" src="https://www.youtube.com/embed/sXFmKquiVnk" frameborder="0" allowfullscreen></iframe>



The field of federated learning, distributed learning and blockchain are areas of interest to me so check back often for more content!

Cheers - Gordon
