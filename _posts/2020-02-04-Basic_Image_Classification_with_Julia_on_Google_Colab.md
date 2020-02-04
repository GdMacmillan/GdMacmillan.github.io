---
layout: article
title: Basic Image Classification with Julia on Google Colab
coverPhoto: /assets/posts/2020-02-04/flux_julia_colab_logo.png
---

## TLDR

Check out my [ML Flux on Colab Tutorial](https://github.com/GdMacmillan/ml_flux_tutorial)! If you click on the .ipynb file in github, it contains a link to the Colab notebook at the top of the rendered notebook.

## Motivation

I happened to be browsing the Julia community discourse forums and came across this post:

[flux-jl-vanilla-ann-loss-goes-to-nan-with-mini-batch](https://discourse.julialang.org/t/flux-jl-vanilla-ann-loss-goes-to-nan-with-mini-batch/25511)

After seeing this, I wanted to build a small relatively easy example in order to show the core components you can build with Flux. With this in mind, I set out to try and repeat some work I [had seen](https://discourse.julialang.org/t/julia-on-google-colab-free-gpu-accelerated-shareable-notebooks/15319) where some enterprising soul had set out to re-create a Julia kernel using the popular Google Colaboratory free Jupyter notebook environment. I also wanted to test Julia and ML Flux on a GPU to see if I could write a basic ad-hoc training workflow.

## Julia Programming Language

[Julia](https://docs.julialang.org/en/latest/) is a high performance dynamic language. Types in Julia are [a property of values not expressions](https://stackoverflow.com/questions/28078089/is-julia-dynamically-typed) i.e. the language does not set expectations for assigned types before executing expressions. Many people believe there is a good reason to prefer this type of execution model when it comes to applications in scientific and high performance computing.

One of the goals of the Julia development community is to provide a flexible language that eliminates the need for separating prototyping and deployment environments. The Julia programming language fulfills this requirement by allowing developers to work on scientific and numerical computing and then deploy code which runs nearly as fast as traditional statically-typed languages.

## Flux

[Flux](https://fluxml.ai/Flux.jl/stable/) comes prebuilt with a variety of tools needed to build machine learning workflows. Install by typing `] add Flux` in your Julia based IDE. If you have CUDA, you can also run `] add CuArrays` to get GPU support. The notebook built for this explainer uses several other packages as well as Flux but the core methods are created using Flux and CuArrays. If you want to build deep learning models for your project, Flux is a good library to start with.

## Google Colab

What is [Colab](https://colab.research.google.com)? I will let the official platform documentation do the explaining. As far as what Data Scientists like to use it for? Well, it arguably provides the best platform on the web for students, engineers and otherwise curious individuals to play around with some seriously great hardware. Documents (Ipython notebooks) can be read or created and stored/executed with just a Google account. There are [Python helpers built by Google](https://colab.research.google.com/notebooks/io.ipynb) to help with connecting to data stored in either Drive or Gcloud. The most popular Python modules come pre-installed in an Anaconda environment and there is even access to bash so you can access the filesystem for more control over your environment. This is how we are able to install Julia and packages required to do deep learning.

## What is Deep Learning?

You may, as I was several years ago, be wondering what is Deep Learning and how could I possibly understand it. The first example of an artificial neural network is thought to have been created by Frank Rosenblatt with the multi-layered perceptron in 1957.

![Multilayer perceptron]({{ site.url }}/assets/posts/2020-02-04/multilayer_perceptron.png)

This form of deep learning was heralded as a turning point in history, from which we would be creating machines that could walk, talk, think and reason about things just as humans do. That could still end up being true, but as of now, modern learning systems must be highly specialized. To perform well, a learning system can not be fed an input which deviates from the expected data type. In the simple case, this means an image classifier must be fed images, an audio classifier, audio, etc... There are various methods which use a backbone neural net to convert data from one form to another, but in each case, we may have a set of inputs X that maps to an output set y.

![Feature mapping]({{ site.url }}/assets/posts/2020-02-04/feature_mapping.png)

### Artificial Neural Netork (NN)

In essence a Neural Network can recognize patterns from complex inputs such as image, audio, video, text and human speech data.

Input samples are passed into NN's creating a set of on-off activations encoding many possible states. Network topology influences the number of ideas or cumulative abstraction applied. Weights are trained to learn input patterns that should map similar states or to features which encode a specific output.

## Conclusion

Because the internet is such a beautiful network of information and there are more qualified people, whose job is in teaching complex mathematical topics, I will offer some links to tools and resources I have used. Again, take a look at the notebook and I encourage you to play around and experiment with it.

* [Neural Networks Intro](https://github.com/sallamander/neural-networks-intro)

* [Lenet](http://deeplearning.net/tutorial/lenet.html)

* [CS231N](http://cs231n.github.io)

A couple of my python projects with deep learning examples:

* [biological image classification](https://github.com/GdMacmillan/kaggle-protein-classification)

* [text classification](https://gitlab.com/denver-ml/kaggle-toxic-comments).

* Small library built using Numpy and Tensorflow: [Pypi](https://pypi.org/project/LensFlare/)
