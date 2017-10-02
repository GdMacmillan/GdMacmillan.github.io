---
layout: article
title: OpenMined Introduction
coverPhoto: /assets/posts/2017-10-01/openmined-logo.png
---

OpenMined is an open-sourced project for distributing machine learning model training and democratizing access to data. The future of capital markets is largely going to be built on Machine Learning and AI. A well trained machine learning model requires data. Access to data is controlled by a couple of large corporations, governments and a few powerful smaller independent entities.

There are three necessary ingredients for AI/ML: 1. data 2. compute power 3. talent.

Most of the research in is already publicly available. Open-sourced libraries, research papers and online learning make learning and teaching ML/AI accessible to most people. Compute power is increasing at an exponential rate (as long as Moore's law is still in effect). But less available and properly in need of solutions is acces to data stores. Here-in lies the problem.

Projects like OpenMind are paving the way to democratized access to data resources and allowing independent companies to keep control of their data while getting payed for it. Due to blockchain technology, smart contracts and Homomorphic encryption, a promising technology is available to distribute access to data, and allow model parameters or gradients be learned from batch training. Let's learn how it works.

Homomorphic Encryption works by encrypting values. The encryption algorithm does this in a way that allows the encrypted value to be operated on mathematically. This enables encrypted values to be used in functions while maintaining their state of encryption. A system can perform computations on encrypted data without the operator ever actually knowing what the data is.

![Homomorphic encryption]({{ site.url }}/assets/posts/2017-10-01/homomorphic-encryption.png)

Some Homomorphic encryption libraries include:
* C++
    * http://sealcrypto.codeplex.com/
    * https://github.com/shaih/HElib
    * https://github.com/tlepoint/homomorphic-simon
* Python -
    * https://github.com/n1analytics/python-paillier
* R -
    * http://www.louisaslett.com/HomomorphicEncryption/

A smart contract is a dataset stored on a blockchain. This Contains 3 things. Data (ledgers, events, statistics), state (today's data, today's events), code (rules for changing state). Code establishes rules for updating the state. Some properties of a smart contract are as follows:

* state and codes around an agreement are constrained
* enforcment of this state is included in the contract

A Blockchain is large distributed dataset. This can be imagined as many machines that all have exact copies of the dataset. No one person or actor can edit or delete an entry. They may only add to the blockchain. Each person's contribution to the dataset are recorded. See this great demonstration for more on what blockchain is all about:

https://anders.com/blockchain/hash.html

Under the proof of work scheme, it is extremely difficult and time consuming to for someone to interject data into older blocks.

A hash is a seemingly random cryptographic representation of data. Can only go from the data to the hash.

When state and code data is stored on the blockchain, you have a unified dataset that everyone can see. The dataset is able to manipulate itself. The code can execute on state and because the code is deterministic, everyone can agree on what the dataset was and everyone can see what the dataset should now be given the updated state. Now there is a shared computation history that lives in the cloud and no one can corrupt. In this way programs can run on there own and can't be manipulated. This pre-agreed upon code is executed on the blockchain in a way that is enforced by consensus.

An appropriate business model can be thought of as follows:
    Step 1: Acquire data about people
    Step 2: Train a model which does something useful
    Step 3: Sell the use of that model (the app)

Lets' observed some business which we shall call AI Inc. This company Can send a model down to Joe, Jane or Jack (individuals) for training. Individual data owners know the model is learning from their data, and gradients are being generated in batches. Gradients are then sent back to AI Inc. and slightly improve the model.

Now one downside is AI Inc. can learn something about data from gradients or conversely, Joe Jane or Jack can steal the model. This issue is known as Differential Privacy and it is an open area of research in Federated Learning.

One solution is Homorphic encryption can be used to encrypt model and gradients so People can keep data secret, model is protected from theft and a uniquely trained model can be profitable business IP. This is because there is no chance of someone else using it to undercut AI inc's price.

![Overview]({{ site.url }}/assets/posts/2017-10-01/ai-inc.png)

Some problems with this are, AI Inc can use the encrypted model to basically steal the dataset. This is possible when Joe, Jack or Jane can't see the model since it is encrypted and they can't see what is going on under the hood. There is also the issue of blind marketplace (no one knows what the model is worth).

Smart contracts can solve this problem. Data scientist's as AI Inc. can send some specification of model plus a bit of money to a smart contract. Joe see's which model's require training, chooses which one he would like to traina and authorizes the contract. Joe trains the model on his data and sends gradients back up to the cloud. There are some other issues to keep in mind but OpenMined has proposed an initial solution for this in Version 1. You can check out the project here: https://github.com/OpenMined


Credits:
<iframe width="560" height="420" src="https://www.youtube.com/watch?v=sXFmKquiVnk"></iframe>



This is an ongoing interest of mine so check back when more content is completed!

Cheers - Gordon
