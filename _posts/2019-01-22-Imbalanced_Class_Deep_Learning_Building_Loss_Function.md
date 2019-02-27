---
layout: article
title: Imbalanced Class Deep Learning - Building A Loss Function
coverPhoto: /assets/posts/2019-01-22/pytorchlossfunction-logo.png
---

# Purpose

I've set up this notebook to serve two purposes: One, as documentation for future work on this loss function and how I wrote the code to work in a model training pipeline. Two, this article should serve as a guide to those who are interested in recognizing which pieces are important while implementing code from scratch according to a scientific research focused paper.

# Introduction

Handling imbalanced class data is a common problem in deep learning. If we assume that the data is representitive of reality (no handling bias, mis-classification of training data, etc...), what can be done to combat this problem? In the context of Convolutional Neural Networks (CNN), we can try to represent classes that are insufficiently represented with higher importance in the loss function. This article discusses a method developed to mine these samples within an online mini-batching framework so as to increase the effectiveness of training a classifier on datasets with imbalanced classes.

Disclaimer:
1. I am not the author of the published work which outlines this approach to this classification loss function. The real paper is published here:

__[Imbalanced Deep Learning by Minority Class Incremental Rectification, Qi Dong, et all](https://arxiv.org/abs/1804.10851)__

2. I intend no disrespect to the authors of this approach
3. I worked to develop my own code for this loss function in an attempt to find a favorable outcome in an image classification challenge.

# Context

CNN's take inputs as two-dimensional images and predict labels based on convolutions applied to outputs from each subsequent layer. Mathematically it is to process cross-correlations as opposed to convolutions although they are related.

For single-label classification we ask a simple question:

![car]({{ site.url }}/assets/posts/2019-01-22/streetview.jpg)

i.e. Is this a picture of a car? ∈ {yes, no}

For multi-class (per-label) classification we are interested in asking the question, "which labels are relevant to the picture?" ⊆ {car, streetlight, pedestrian, cyclist, signpost, etc..}
i.e., each instance can have multiple labels instead of a single one!

Cross-Entropy loss function is commonly used for learning a multi-class classification CNN model where overall loss on a mini-batch of n images is taken as the average additive sum of attribute-level loss with equal weight applied over all labels.

<div>
\begin{equation*}
\mathcal{L}_{ce} = -\frac{1}{n_{bs}} \sum^{n_{bs}}_{i=1}\sum^{n_{attr}}_{j=1}log\left(p(y_{i,j} = a_{i,j} | \textbf{x}_{i,j})\right)
\end{equation*}
</div>

$\textbf{x}_{i,j}$ denotes the feature vector of $\textbf{I}_{i}$ for the jth attribute label and $p(y_{i,j} = a_{i,j}|\textbf{x}_{i,j}$) is the corresponding posterior probability of $\textbf{I}_{i}$ over the ground truth $a_{i, j}$

The cross-entropy loss function is conditioning model learning to minimize training error by assuming that individual samples and classes are of equal importance. In order to achieve good performance and generalization, networks trained with CE need to have large training sets with sufficiently balanced class distributions.

# Code

The following code supports some of the functions used in the interactive design of this loss function


```python
import os

import torch
import torch.nn as nn
import torch.nn.functional as F

from torchvision import transforms
from torch.utils.data import Dataset, DataLoader
from skimage import io, transform, img_as_float
```


```python
label_file = "../data/train.csv"
image_dir = '../data/train_images'
```


```python
def to_one_hot(df):
    tmp = df.Target.str.get_dummies(sep=' ')
    tmp.columns = map(int, tmp.columns)
    return df.join(tmp.sort_index(axis=1))

def get_image_ids_from_dir_contents(image_dir):
    all_images = [name for name in os.listdir(image_dir) \
                  if os.path.isfile(os.path.join(image_dir, name))]
    return list(set([name.split('_')[0] for name in all_images]))
```


```python
class TrainImageDataset(Dataset):
    """Fluorescence microscopy images of protein structures training dataset"""

    def __init__(self,
        image_dir,
        label_file,
        transform=None,
        idxs=None,
        using_pil=False
    ):
        """
        Args:
            label_file (string): Path to the csv file with annotations.
            image_dir (string): Directory with all the images.
            transform (callable, optional): Optional transform to be applied
                on a sample.
        """
        self.image_dir = image_dir
        self.transform = transform
        self.idxs = idxs
        self.labels = to_one_hot(pd.read_csv(label_file))
        self.using_pil = using_pil
        if self.idxs is not None:
            self.labels = self.labels.iloc[self.idxs, :].\
                                                reset_index(drop=True)

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        img_name = self.labels.iloc[idx, 0]
        img_red = img_name + '_red.png'
        img_blue = img_name + '_blue.png'
        img_green = img_name + '_green.png'
        img_yellow = img_name + '_yellow.png'

        if self.using_pil:
            pth2img = lambda x: io.imread(x)
        else:
            pth2img = lambda x: img_as_float(io.imread(x))

        img_red = pth2img(os.path.join(self.image_dir, img_red))
        img_blue = pth2img(os.path.join(self.image_dir, img_blue))
        img_green = pth2img(os.path.join(self.image_dir, img_green))
        img_yellow = pth2img(os.path.join(self.image_dir, img_yellow))
        labels = self.labels.iloc[idx, 2:].values
        labels = labels.astype('int')
        sample = {'image_id': img_name,
                  'image_red': img_red,
                  'image_blue': img_blue,
                  'image_green': img_green,
                  'image_yellow': img_yellow,
                  'labels': labels}

        if self.transform:
            sample = self.transform(sample)

        return sample
```


```python
class CombineColors(object):
    """Combines the the image in a sample to a given size."""
    def __init__(self, pretrained=False):
        self.pretrained = pretrained

    def __call__(self, sample):
        img_name = sample['image_id']
        img_red = sample['image_red']
        img_blue = sample['image_blue']
        img_green = sample['image_green']
        img_yellow = sample['image_yellow']
        labels = sample['labels']
        if self.pretrained:
            image = np.dstack((img_red, img_green, img_blue))
        else:
            image = np.dstack((img_red, img_blue, img_green, img_yellow))

        return {'image': image, 'labels': labels, 'image_id': img_name}


class ToPILImage(object):
    """Convert ndarrays in sample to Tensors."""
    def __init__(self, mode=None):
        self.mode = mode

    def __call__(self, sample):
        img_name = sample['image_id']
        image = sample['image']
        labels = sample['labels']
        image = transforms.ToPILImage(self.mode)(image)

        return {'image': image,
                'labels': labels,
                'image_id': img_name}


class RandomResizedCrop(object):
    """Convert ndarrays in sample to Tensors."""
    def __init__(self, size=224):
        self.size = size

    def __call__(self, sample):
        img_name = sample['image_id']
        image = sample['image']
        labels = sample['labels']
        image = transforms.RandomResizedCrop(self.size)(image)

        return {'image': image,
                'labels': labels,
                'image_id': img_name}


class RandomHorizontalFlip(object):
    """Convert ndarrays in sample to Tensors."""

    def __call__(self, sample):
        img_name = sample['image_id']
        image = sample['image']
        labels = sample['labels']
        image = transforms.RandomHorizontalFlip()(image)

        return {'image': image,
                'labels': labels,
                'image_id': img_name}


class Resize(object):
    """Convert ndarrays in sample to Tensors."""
    def __init__(self, size=256):
        self.size = size

    def __call__(self, sample):
        img_name = sample['image_id']
        image = sample['image']
        labels = sample['labels']
        image = transforms.Resize(self.size)(image)

        return {'image': image,
                'labels': labels,
                'image_id': img_name}


class CenterCrop(object):
    """Convert ndarrays in sample to Tensors."""
    def __init__(self, size=224):
        self.size = size

    def __call__(self, sample):
        img_name = sample['image_id']
        image = sample['image']
        labels = sample['labels']
        image = transforms.CenterCrop(self.size)(image)

        return {'image': image,
                'labels': labels,
                'image_id': img_name}


class ToTensor(object):
    """Convert ndarrays in sample to Tensors."""

    def __call__(self, sample):
        img_name = sample['image_id']
        image = sample['image']
        labels = sample['labels']
        image = transforms.ToTensor()(image)

        return {'image': image.type(torch.FloatTensor),
                'labels': torch. \
                    from_numpy(labels).type(torch.FloatTensor),
                'image_id': img_name}


class NumpyToTensor(object):
    """Convert ndarrays in sample to Tensors."""

    def __call__(self, sample):
        img_name = sample['image_id']
        image = sample['image']
        labels = sample['labels']
        # swap color axis because
        # numpy image: H x W x C
        # torch image: C X H X W
        image = image.transpose((2, 0, 1))

        return {'image': torch. \
                    from_numpy(image).type(torch.FloatTensor),
                'labels': torch. \
                    from_numpy(labels).type(torch.FloatTensor),
                'image_id': img_name}


class Normalize(object):
    """Normalize a tensor image with mean and standard deviation.
    Given mean: ``(M1,...,Mn)`` and std: ``(S1,..,Sn)`` for ``n`` channels,
    this transform will normalize each channel of the input ``torch.*Tensor``
    i.e.
    ``input[channel] = (input[channel] - mean[channel]) / std[channel]``
    .. note::
        This transform acts in-place, i.e., it mutates the input tensor.
    Args:
        mean (sequence): Sequence of means for each channel.
        std (sequence): Sequence of standard deviations for each channel.
    """

    def __init__(self, mean, std):
        self.mean = mean
        self.std = std

    def __call__(self, sample):
        """
        Args:
            tensor (Tensor): Tensor image of size (C, H, W) to be normalized.
        Returns:
            Tensor: Normalized Tensor image.
        """
        img_name = sample['image_id']
        image = sample['image']
        labels = sample['labels']
        image = transforms.Normalize(self.mean, self.std)(image)

        return {'image': image,
                'labels': labels,
                'image_id': img_name}

    def __repr__(self):
        return self.__class__.__name__ + '(mean={0}, std={1})'.\
                                            format(self.mean, self.std)


def get_transforms(pretrained=False):
    if pretrained:
        transform = {
            'TRAIN': transforms.Compose(
                            [CombineColors(pretrained),
                             ToPILImage(),
                             RandomResizedCrop(224),
                             RandomHorizontalFlip(),
                             ToTensor(),
                             Normalize(mean=[0.485, 0.456, 0.406],
                                        std=[0.229, 0.224, 0.225])
                            ]
            ),
            'DEV': transforms.Compose(
                            [CombineColors(pretrained),
                             ToPILImage(),
                             Resize(256),
                             CenterCrop(224),
                             ToTensor(),
                             Normalize(mean=[0.485, 0.456, 0.406],
                                        std=[0.229, 0.224, 0.225])
                            ]
            )
        }
    else:
        transform = {
            'TRAIN': transforms.Compose(
                            [CombineColors(),
                             NumpyToTensor()
                             ]
            ),
            'DEV': transforms.Compose(
                            [CombineColors(),
                             NumpyToTensor()
                             ]
            )
        }

    return transform
```

Create the DataLoader so we can get batches of images from the training set to work with. This was essential for debugging purposes and testing the loss function in our Pytorch model training framework.


```python
transform = get_transforms(pretrained=False)
train_dataset = TrainImageDataset(image_dir=image_dir,
                                  label_file=label_file,
                                  transform=transform['TRAIN'])

trainLoader = DataLoader(train_dataset, shuffle=True, **{'batch_size': 32})
```

The iter function returns an iterable of the dataLoader class instance which supports iteration using the next function.


```python
data = next(iter(trainLoader))
inputs, labels = data['image'], data['labels']
```

Next, we set our batch size and number of classes using the following 2 variables.


```python
nbs = 32 # batch size
ncl = 28 # num classes
```

## Minority Class Hard Sample Mining

This method of mining hard examples to supplement the baseline CE loss is done by "borrowing" samples from the majority class in regions where class distribution bias is highest. We can visualize this in the following image where border areas with highest density of majority class samples represent the region where hard sample mining is most effective.

<img src="{{ site.url }}/assets/posts/2019-01-22/class_decision_boundary.png" width="400">

For hard sample mining, we first profile the minority and majority classes per label in each training mini-batch with n training samples. We profile the class distribution hj

#### Class Distribution profile

$h_k^j$ denotes the number of training samples with j-th attribute value assigned to class k


```python
hjk = labels.sum(0); hjk
```




    tensor([16.,  1.,  2.,  2.,  2.,  0.,  1.,  6.,  0.,  0.,  0.,  1.,  1.,  0.,
             0.,  0.,  0.,  0.,  1.,  2.,  0.,  6.,  0.,  3.,  0.,  7.,  0.,  0.])




```python
cls_labels = torch.arange(ncl); cls_labels # not required
```




    tensor([ 0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15, 16, 17,
            18, 19, 20, 21, 22, 23, 24, 25, 26, 27])




```python
sorted_cls_labels = np.argsort(hjk); sorted_cls_labels
```




    tensor([13, 24, 22, 20, 17, 16, 15, 14, 26, 10, 27,  8,  5,  9, 11, 12,  1,  6,
            18,  2, 19,  4,  3, 23, 21,  7, 25,  0])




```python
sorted_hjk = hjk[sorted_cls_labels]; sorted_hjk
```




    tensor([ 0.,  0.,  0.,  0.,  0.,  0.,  0.,  0.,  0.,  0.,  0.,  0.,  0.,  0.,
             1.,  1.,  1.,  1.,  1.,  2.,  2.,  2.,  2.,  3.,  6.,  6.,  7., 16.])



To determine minority class indexes, for the multiclass setting, we set a probability threshold, ρ=50%, meaning that all minority classes collectively account for at most half or less samples per batch. This was determined by the authors to be the best setting for this threshold.


```python
th = .5 * nbs

def get_min_class_boundary(arr):
    for idx in torch.arange(len(arr)):
        if arr[:idx].sum() > th:
            return idx - 1
    return arr.size
```


```python
bound = get_min_class_boundary(sorted_hjk); bound
```




    tensor(24)




```python
sorted_hjk[:bound].sum() # should be less than or equal  16
```




    tensor(16.)




```python
sorted_hjk = sorted_hjk[:bound]
min_cls_labels = sorted_cls_labels[:bound]
```


```python
idxs = np.argsort(min_cls_labels) # unsort
min_cls_labels = min_cls_labels[idxs]
hjk = sorted_hjk[idxs]
print(min_cls_labels)
print(hjk)
```

    tensor([ 1,  2,  3,  4,  5,  6,  8,  9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
            20, 22, 23, 24, 26, 27])
    tensor([1., 2., 2., 2., 0., 1., 0., 0., 0., 1., 1., 0., 0., 0., 0., 0., 1., 2.,
            0., 0., 3., 0., 0., 0.])


The minority classes which have less than two samples must be ignored so we must also filter on hjk > 1. This enables us to use a more flexible loss function, e.g. triplet loss which requires at least two matched samples as it is impossible to construct a triple where only one or no sample images exist for that class in the batch. Unfortunately if batch size is small, some minority classes will be ignored producing no better classification performance on samples from those classes. A possibility I didn't investigate would be using oversampling methods on the dataset to increase the effectiveness of the classifier on low probability classes naively while at the same to using Cross-entropy loss.


```python
msk = hjk > 1
hjk = hjk[msk]
min_cls_labels = min_cls_labels[msk]
print(min_cls_labels)
print(hjk)
```

    tensor([ 2,  3,  4, 19, 23])
    tensor([2., 2., 2., 2., 3.])


We can abstract the above into a function easily.


```python
def get_minority_classes(y, batchSz):
    sorted_hjk, ix = y.sum(0).sort()
    mask = torch.cumsum(sorted_hjk, 0) <= .5 * batchSz
    sorted_hjk = sorted_hjk[mask]
    sorted_, sorted_ix = ix[mask].sort()

    return sorted_[sorted_hjk[sorted_ix] > 1]
```


```python
min_cls_labels = get_minority_classes(labels, nbs); min_cls_labels
```




    tensor([ 2,  3,  4, 19, 23])



Note: possible difference in class indices. Since sort is random in its ordering of integer values that are the same class, label indices may be random at margin of minority classes and non-minority classes.

Given the minortiy classes, let us find the hardness metric for sampling instances which encourage model learning to concentrate on weak recognitions or obvious mistakes. Explicitly, at the class level, we quantify sample hardness regarding a given class per label by saying for each minority class c of the attribute label j, we refer to "hard-positives" as follows:

\begin{align}
P_{c,j}^{cls} = \{x_{i,j} | a_{i,j} = c\text{, low } p(y_{i,j} = c | x_{i,j})\}
\end{align}

\begin{align}
N_{c,j}^{cls} = \{x_{i,j} | a_{i,j} \neq c\text{, low } p(y_{i,j} = c | x_{i,j})\}
\end{align}

Create some random predictions in the range [0-1]:


```python
bs = (nbs, ncl) # batch array size
preds = np.random.rand(*bs) # random predictions for batch
preds = torch.Tensor(preds)
```

Identify positive examples which are associated with a minority class.

$x_{i,j} | a_{i,j} = c$


```python
y_min = labels[:, min_cls_labels]
# y_min = labels.numpy()[:, min_cls_labels.numpy()]
msk = y_min == 1
```


```python
P = torch.nonzero(msk); P # anchor instances
# P = np.argwhere(msk)
```




    tensor([[ 0,  2],
            [ 4,  1],
            [ 7,  4],
            [ 8,  3],
            [16,  2],
            [17,  3],
            [22,  4],
            [23,  0],
            [24,  4],
            [27,  0],
            [30,  1]])



Identify negative examples which are associated with a minority class.

$x_{i,j} | a_{i,j} \neq c$


```python
N = torch.nonzero(~msk)
# N = np.argwhere(~msk)
```

get probabilities for positive examples associated with a minority class


```python
preds_min = preds[:, min_cls_labels]
preds_P = preds_min[msk]
```

get probabilities for negtive examples associated with a minority class


```python
preds_N = preds_min[~msk]
```

select top 3 (if needed)


```python
k = 3
preds_P[np.argsort(preds_P)][:k]
```




    tensor([0.0699, 0.2911, 0.3560])




```python
preds_N[np.argsort(preds_N)][-k:]
```




    tensor([0.9943, 0.9962, 0.9992])



### Incremental Batch-Wise Minority Class Example Mining

Now that we know how to break down the batch into minority classes sorted on predicted probabilities, we can think about how to select hard examples. Specifically, at training time, for a minority class c of attribute label j (or a minority class instance $x_{i,j}$ ) in each training batch data, we select κ hard-positives as the bottom-κ scored on c (or bottom-κ (largest) distances to $x_{i,j}$ ), and κ hard-negatives as the top-κ scored on c (or top-κ (smallest) distance to $x_{i,j}$ ), given the current model (or feature space)

OK, lets put it all together. Given a tensor of y_predictions for minority labels...


```python
preds_min[:5] # head
```




    tensor([[0.0470, 0.7478, 0.9298, 0.3756, 0.6976],
            [0.9884, 0.2246, 0.2024, 0.0239, 0.4681],
            [0.4855, 0.3372, 0.3361, 0.2750, 0.9942],
            [0.5962, 0.7024, 0.2237, 0.4732, 0.8331],
            [0.0528, 0.5929, 0.5445, 0.5244, 0.5590]])



We form at most $κ^2$ triplets $T = \{(x_{a,j}, x_{+,j}, x_{-,j})_s\}_{s=1}^{\kappa^2}$ with respect to $x_{a, j}$, and a total of at most $\left|X_{min}\right| × κ^2$ triplets $T$ for all anchors $X_{min}$ across all the minority classes of every attribute label. The meshgrid function is used to create row-wise combinations of indexes/probabilities.


```python
k = 3
for idx, row in enumerate(P):
    anchor_idx, anchor_class = row
    mask = (P[:, 1] == anchor_class)
    mask[idx] = 0
    pos_idxs = P[mask]
    pos_preds, sorted_= preds_min[pos_idxs[:, 0], pos_idxs[:, 1]].sort()
    pos_idxs = pos_idxs[sorted_][:k]
    pos_preds = pos_preds[:k]

    mask = (N[:, 1] == anchor_class)
    neg_idxs = N[mask]
    neg_preds, sorted_= preds_min[neg_idxs[:, 0], neg_idxs[:, 1]].sort()
    neg_idxs = neg_idxs[sorted_][-k:]
    neg_preds = neg_preds[:k]

    a = [idx]
    n_p = pos_idxs.shape[0]
    n_n = neg_idxs.shape[0]
    grid = torch.stack(torch.meshgrid([torch.Tensor(a).long(), torch.arange(n_p), torch.arange(n_n)])).reshape(3, -1).t()
    print(torch.cat([P[grid[:, 0]], pos_idxs[grid[:, 1]], neg_idxs[grid[:, 2]]], 1))
    print("")
    print(torch.stack([preds_P[grid[:, 0]], pos_preds[grid[:, 1]], neg_preds[grid[:, 2]]], 1))
    print("")

```

    tensor([[ 0,  2, 16,  2,  5,  2],
            [ 0,  2, 16,  2, 30,  2],
            [ 0,  2, 16,  2,  8,  2]])

    tensor([[0.9298, 0.2911, 0.0002],
            [0.9298, 0.2911, 0.0192],
            [0.9298, 0.2911, 0.0221]])

    tensor([[ 4,  1, 30,  1, 23,  1],
            [ 4,  1, 30,  1, 24,  1],
            [ 4,  1, 30,  1,  9,  1]])

    tensor([[0.5929, 0.9966, 0.0099],
            [0.5929, 0.9966, 0.0133],
            [0.5929, 0.9966, 0.0646]])

    tensor([[ 7,  4, 24,  4, 13,  4],
            [ 7,  4, 24,  4,  2,  4],
            [ 7,  4, 24,  4, 26,  4],
            [ 7,  4, 22,  4, 13,  4],
            [ 7,  4, 22,  4,  2,  4],
            [ 7,  4, 22,  4, 26,  4]])

    tensor([[0.5990, 0.3560, 0.0325],
            [0.5990, 0.3560, 0.1251],
            [0.5990, 0.3560, 0.1417],
            [0.5990, 0.5090, 0.0325],
            [0.5990, 0.5090, 0.1251],
            [0.5990, 0.5090, 0.1417]])

    tensor([[ 8,  3, 17,  3, 16,  3],
            [ 8,  3, 17,  3,  5,  3],
            [ 8,  3, 17,  3,  7,  3]])

    tensor([[0.6970, 0.5889, 0.0239],
            [0.6970, 0.5889, 0.0317],
            [0.6970, 0.5889, 0.0371]])

    tensor([[16,  2,  0,  2,  5,  2],
            [16,  2,  0,  2, 30,  2],
            [16,  2,  0,  2,  8,  2]])

    tensor([[0.2911, 0.9298, 0.0002],
            [0.2911, 0.9298, 0.0192],
            [0.2911, 0.9298, 0.0221]])

    tensor([[17,  3,  8,  3, 16,  3],
            [17,  3,  8,  3,  5,  3],
            [17,  3,  8,  3,  7,  3]])

    tensor([[0.5889, 0.6970, 0.0239],
            [0.5889, 0.6970, 0.0317],
            [0.5889, 0.6970, 0.0371]])

    tensor([[22,  4, 24,  4, 13,  4],
            [22,  4, 24,  4,  2,  4],
            [22,  4, 24,  4, 26,  4],
            [22,  4,  7,  4, 13,  4],
            [22,  4,  7,  4,  2,  4],
            [22,  4,  7,  4, 26,  4]])

    tensor([[0.5090, 0.3560, 0.0325],
            [0.5090, 0.3560, 0.1251],
            [0.5090, 0.3560, 0.1417],
            [0.5090, 0.5990, 0.0325],
            [0.5090, 0.5990, 0.1251],
            [0.5090, 0.5990, 0.1417]])

    tensor([[23,  0, 27,  0, 10,  0],
            [23,  0, 27,  0,  1,  0],
            [23,  0, 27,  0, 17,  0]])

    tensor([[0.4656, 0.0699, 0.0470],
            [0.4656, 0.0699, 0.0528],
            [0.4656, 0.0699, 0.1229]])

    tensor([[24,  4, 22,  4, 13,  4],
            [24,  4, 22,  4,  2,  4],
            [24,  4, 22,  4, 26,  4],
            [24,  4,  7,  4, 13,  4],
            [24,  4,  7,  4,  2,  4],
            [24,  4,  7,  4, 26,  4]])

    tensor([[0.3560, 0.5090, 0.0325],
            [0.3560, 0.5090, 0.1251],
            [0.3560, 0.5090, 0.1417],
            [0.3560, 0.5990, 0.0325],
            [0.3560, 0.5990, 0.1251],
            [0.3560, 0.5990, 0.1417]])

    tensor([[27,  0, 23,  0, 10,  0],
            [27,  0, 23,  0,  1,  0],
            [27,  0, 23,  0, 17,  0]])

    tensor([[0.0699, 0.4656, 0.0470],
            [0.0699, 0.4656, 0.0528],
            [0.0699, 0.4656, 0.1229]])

    tensor([[30,  1,  4,  1, 23,  1],
            [30,  1,  4,  1, 24,  1],
            [30,  1,  4,  1,  9,  1]])

    tensor([[0.9966, 0.5929, 0.0099],
            [0.9966, 0.5929, 0.0133],
            [0.9966, 0.5929, 0.0646]])



What the above result shows is that, for a batch of images with corresponding labels, we can construct tensors for each triplet. These tesnors are concatenated together and fed into the triplet loss function. We then obtain a single loss value for the batch.

I had to first implement this in Numpy. This code is commented but shown below for those interested in how Numpy translates to Pytorch. I have tried to use similar syntax but variable names may have changed.


```python
# def mine_positives(anchor, labels, predictions):
#     cls = np.argwhere(labels[anchor] == 1)
#     P = np.argwhere(labels == 1)
#     preds_P = predictions[labels == 1]
#     out = P[np.isin(P[:, 1], cls)]
#     out_preds = preds_P[np.isin(P[:, 1], cls)]
#     input_mask = out[:, 0] != anchor
#     out = out[input_mask]
#     out_preds = out_preds[input_mask]
#     sorted_ = out_preds.argsort()
#     return out[sorted_], out_preds[sorted_]

# def mine_negatives(anchor, labels, predictions):
#     cls = np.argwhere(labels[anchor] == 0)
#     N = np.argwhere(labels == 0)
#     preds_N = predictions[labels == 0]
#     out = N[np.isin(N[:, 1], cls)]
#     out_preds = preds_N[np.isin(N[:, 1], cls)]
#     sorted_ = out_preds.argsort()
#     return out[sorted_], out_preds[sorted_]


# anchor_idxs = P[:, 0]
# k = 3
# for idx in anchor_idxs:
#     anc_examples, anc_preds = P[P[:, 0] == idx], preds_P[P[:, 0] == idx]
#     pos_examples, pos_preds = mine_positives(idx, y_min, preds_min)
#     neg_examples, neg_preds = mine_negatives(idx, y_min, preds_min)
#     pos_examples = pos_examples[:k]
#     neg_examples = neg_examples[-k:]
#     n_a = anc_examples.shape[0]
#     n_p = pos_examples.shape[0]
#     n_n = neg_examples.shape[0]
#     grid = np.array(np.meshgrid(np.arange(n_a), np.arange(n_p), np.arange(n_n))).T.reshape(-1,3)
#     print(anc_examples[grid[:, 0]], pos_examples[grid[:, 1]], neg_examples[grid[:, 2]])
#     print("")
```

# Loss Function Class Code

Below, I have included the code for the entire loss function which contains the work I did above. This works as a drop in replacement for binary entropy loss as long as hyperparameteres are provided.


```python
class TripletLoss(nn.Module):

    def __init__(self, margin):
        super(TripletLoss, self).__init__()
        self.margin = margin

    def forward(self, anchor, positive, negative, size_average=True):
        distance_positive = F.l1_loss(anchor, positive, reduction='sum')
        distance_negative = F.l1_loss(anchor, negative, reduction='sum')
        losses = F.relu(distance_positive - distance_negative + self.margin)
        return losses.mean() if size_average else losses.sum()


class IncrementalClassRectificationLoss(nn.Module):

    def __init__(self,
        margin,
        alpha,
        batchSz,
        k,
        class_level_hard_mining=True,
        sigmoid=True
    ):
        super(IncrementalClassRectificationLoss, self).__init__()

        self.margin = margin
        self.alpha = alpha
        self.batchSz = batchSz
        self.k = k
        self.class_level_hard_mining = class_level_hard_mining
        self.sigmoid = sigmoid
        self.trip_loss = TripletLoss(margin)
        self.bce = nn.BCEWithLogitsLoss()

    def forward(self, input, target, X):
        bce = self.bce(input, target)
        idxs = get_minority_classes(target, batchSz=self.batchSz)
        if self.sigmoid:
            input = torch.sigmoid(input)
            y_min = target[:, idxs]
            preds_min = input[:, idxs]
        else:
            y_min = target[:, idxs]
            preds_min = input[:, idxs]

        y_mask = y_min == 1
        P = torch.nonzero(y_mask)
        N = torch.nonzero(~y_mask)
        preds_P = preds_min[y_mask]

        k = self.k
        idx_tensors = []
        pred_tensors = []
        # would like to vectorize this
        for idx, row in enumerate(P):
            anchor_idx, anchor_class = row
            mask = (P[:, 1] == anchor_class)
            mask[idx] = 0
            pos_idxs = P[mask]
            pos_preds, sorted_= preds_min[pos_idxs[:, 0], pos_idxs[:, 1]].sort()
            pos_idxs = pos_idxs[sorted_][:k]
            pos_preds = pos_preds[:k]

            mask = (N[:, 1] == anchor_class)
            neg_idxs = N[mask]
            neg_preds, sorted_= preds_min[neg_idxs[:, 0], neg_idxs[:, 1]].sort()
            neg_idxs = neg_idxs[sorted_][-k:]
            neg_preds = neg_preds[:k]

            a = [idx] # anchor index in P
            n_p = pos_idxs.shape[0]
            n_n = neg_idxs.shape[0]
            # create 2d array with indices for anchor, pos and neg examples
            grid = torch.stack(torch.meshgrid([torch.Tensor(a).long(), torch.arange(n_p), torch.arange(n_n)])).reshape(3, -1).t()
            idx_tensors.append(torch.cat([P[grid[:, 0]], pos_idxs[grid[:, 1]], neg_idxs[grid[:, 2]]], 1))
            pred_tensors.append(torch.stack([preds_P[grid[:, 0]], pos_preds[grid[:, 1]], neg_preds[grid[:, 2]]], 1))

        try:
            if self.class_level_hard_mining:
                idx_tensors = torch.cat(idx_tensors, 0)
                pred_tensors = torch.cat(pred_tensors, 0)
            else:
                # TODO: implement instance level hard mining
                pass
            crl = self.trip_loss(pred_tensors[:, 0], pred_tensors[:, 1], pred_tensors[:, 2])
            loss = self.alpha * crl + (1 - self.alpha) * bce

            return loss

        except RuntimeError:
            # Getting runtime error in torch.cat above as sometimets there are
            # no index or pred tensors to combine from hard mining
            logging.warning('RuntimeError in loss statement')

            return bce

```

We define $\Omega$ as the minimum percentage count of data samples required over all classes in order to form an overall uniform (i.e. balanced) class distribution in the training data . eta is a hyperparameter to be tuned by cross validation.


```python
omega = 11 / 12885 # class imbalance measure from reference data set counts.min() / counts.max()
eta = 0.01 # hyperparameter to be tuned
alpha = omega * eta # 8.537058595265812e-06
```

We don't use sigmoid because simulated predictions are already in the range [0-1]


```python
criterion = IncrementalClassRectificationLoss(0.5, alpha, 28, 3, sigmoid=False)
```

And finally, the loss calculated on the mini-batch used as an example is...


```python
criterion(preds, labels, inputs)
```




    tensor(0.9546)



# Conclusion

In this article we have seen how to construct a novel loss function for end to end deep learning on image classification tasks. The loss function is characterized by a incremental batch wise rectification of minority classes using hard mining. The idea is then to use this to regularize a biased learner in the case of highly imbalanced class training data. I have also proven that this implementation is an effective way of doing in batch mining for samples. It is both fast and has minimal runtime errors as long as batch size is large enough that there are minor classes with more than 1 sample per batch.

Many Thanks to the authors of the paper, Imbalanced Deep Learning by Minority Class Incremental Rectification-

Qi Dong, Shaogang Gong, and Xiatian Zhu

<script type="text/javascript"
   src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js?config=TeX-AMS-MML_CHTML">
</script>
