---
layout: article
title: NLP and Information Retrieval with Julia
coverPhoto: /assets/posts/2019-08-05/text_classification_workflow.png
---

Preface: I realize the notebook conversion doesn't look very good in this blog post. I am working on an update that will fix this. For better formatting see the notebook in the github repo (link below)

## Purpose

We are going to talk about a topic often talked about in the context of Python. With many well supported packages and a vibrant community of developers around them, why wouldn't we use Python? Well, the simplicity and user friendly syntax of Julia along with the ability to run as fast as C at compile time, would seme like a good reason for one. So how good is Julia when the task is understanding the naturual language and it's subtleties? We are going to take a look below. Code for the following can be found here:
[https://github.com/GdMacmillan/Julia-NLP-and-Information-Retrieval](https://github.com/GdMacmillan/Julia-NLP-and-Information-Retrieval)

## Setup

The data source is usually a document database such as MongoDB. I've started a client with a local mongo service and loaded the data from a json document that is supposed to mimic the real-life document one might recieve from a web scraper. I won't go into how to do this with this tutorial so lets assume the documents are already loaded in a local Mongo service.



### Loading Data from Mongo

For my pipeline, I want to extract the text content from my database to flat files (txt) located in a directory called data. I also will write a section_names.csv file with the ids and names of the sections. To do this I will call a python script, aptly called load_nyt_data.py. I did this in python as I already had pymongo installed and the main goal is to perform common nlp tasks with julia, not implement python code. Number of files written will be 0 if files already exist locally.


```julia
run(`python src/load_nyt_data.py`)
```

    Number of files written:  0





    Process(`[4mpython[24m [4msrc/load_nyt_data.py[24m`, ProcessExited(0))



## Text Processing Pipeline

The goal is to build a basic text processing pipeline involving tokenization, stripping stopwords and stemming. Ultimately what we want is a sparse representation of the data where 1 row of data is a document and each column is a unique term, such as a unigram, bigram or trigram. The values herein will be generated from a vectorization method which assigns each document term a value which is proportional to its frequency in the document, but inversely proportional to the number of documents in which it occurs.

### Load data using TextAnalysis and Glob

The main package we will be using for this pipeline is [Text Analysis](https://github.com/JuliaText/TextAnalysis.jl). Text analysis is supported by the [JuliaText organization](https://github.com/JuliaText) and parallels several supported packages for working with data in the form of text.


```julia
using TextAnalysis
using Glob
```

Create an array of filenames


```julia
fnames = glob("data/*.txt");
```

Read an example file


```julia
# example file
readlines(fnames[1])
```




    42-element Array{String,1}:
     ""                                                                                                                              
     ""                                                                                                                              
     ""                                                                                                                              
     ""                                                                                                                              
     ""                                                                                                                              
     ""                                                                                                                              
     ""                                                                                                                              
     ""                                                                                                                              
     ""                                                                                                                              
     ""                                                                                                                              
     ""                                                                                                                              
     "Hey, the man on the phone said. Are you still coming tonight?        "                                                         
     " "                                                                                                                             
     ⋮                                                                                                                               
     "Recommended B.L.T.; chilled charred broccoli; porgy; burger; wings; country fried duck and waffles; pork ribs; smores.        "
     "Prices \$5 to \$29.        "                                                                                                   
     "Open Nightly for dinner, Saturday and Sunday for brunch.        "                                                              
     "Reservations Accepted.        "                                                                                                
     "Wheelchair access Entrance is up a short flight of stairs from the sidewalk. Restrooms have handrails.        "                
     ""                                                                                                                              
     ""                                                                                                                              
     ""                                                                                                                              
     " "                                                                                                                             
     ""                                                                                                                              
     ""                                                                                                                              
     ""                                                                                                                              



We can also map a file document type to the filenames in fnames. This produces an array of FileDocuments.


```julia
fds = map(FileDocument, fnames);
```

We can read a file using the text function.


```julia
text(fds[1])
```




    "\n\n\n\n\n\n\n\n\n\n\nHey, the man on the phone said. Are you still coming tonight?        \n \n\nIt took a moment for me to realize that he was calling from Distilled to confirm my dinner reservation.        \nYes, I replied. Cool, he said, and sounded as if he meant it.        \nDistilled opened in June on the corner of Franklin Street and West Broadway in TriBeCa, the former home of Drew Nieporents Layla and Centrico. The belly dancers and the frozen-margarita machine are gone, but a certain effervescence remains. So does Mr. Nieporent, hovering in the background as guru to Distilleds owners, the first-time restaurateur Nick Iovacchini and Shane Lyons, the 25-year-old chef.        \nThe space is blandly handsome, with dark woods and charcoal banquettes, breathlessly high ceilings and quasi-medieval wheel chandeliers like crowns of fire. One side is devoted to the bar, where the drinks, by Benjamin Wood, are lady-killers, elegant with a knife twist. Occasionally 1980s mope rock shimmers from the speakers.        \nService is confoundingly friendly, almost coddling. When I stood outside reading the posted menu, someone came hurrying down the steps to hand me my own copy, so I wouldnt crane my neck, he said. On arrival and departure, a host leapt to open the door.        \nThe mission statement that preceded one meal (We are a modern American public house, the waiter intoned) was both unnecessary and slightly coy about Mr. Lyonss ambitions. Yes, wings are on the menu, but they are jacked up with gochujang, Korean fermented soybean and chile paste  borrowed, perhaps, from the larder at Momofuku Noodle Bar, where Mr. Lyons worked for a year.        \nThere are occasional technical flourishes, like watermelon cubes Cryovaced to intensify their flavor, and mushrooms surrounded by puffs of buttery onion soubise, aerated by an iSi siphon. A tousle of dehydrated and shaved bacon adorns an open-face sandwich of heirloom tomatoes and basil on sourdough: a B.L.T., of course. Sunflower sprouts make up for the missing crunch.        \nOther classics are updated rather than upended: popcorn dusted with garlic, cumin and brewers yeast, which evokes cheese; snappy pickles fermented with gochugaru, Korean red chile powder; pork ribs glazed with more gochujang, teasing the sweet-salty border without straying too far in either direction.        \nOnion rings, battered with Yuengling beer and tapioca flour, are fried, then frozen (a theatrical waiter boasted that they had been brought to negative 60 degrees) and fried again. They arrive nicely sturdy, the sole purpose of their existence to ferry the narcotic-like condiments, burned scallions cut with jalapeos and mayonnaise with the sting of preserved lime.        \nThe substantial burger (which the menu modestly refrains from telling you is made with grass-fed, organic-grain-finished beef) is abetted by what may be the finest version of Tater Tots in town, the grated potatoes cooked until just underdone and then crisped with Wondra flour.        \nEverything here goes to 11, one diner marveled. Duck breaded and fried like chicken is brazen and irresistible, despite the oversweet accompanying waffle, a spongy slab of brioche dredged in custard, like French toast. Even broccoli turns wanton, flung with slivers of duck bacon and pickled watermelon rind in a fish sauce vinaigrette, with (wait for it) a dollop of duck fat.        \nBut liver pt served with plumes of baked, dehydrated chicken skin? Now this is confrontational. My mission in life is to make skinny girls fat, Mr. Lyons told my table. He got a laugh, but the cracklings were abandoned after one bite.        \nThe only logical end to such a meal is smores  deconstructed, as is the fashion, with a hickory-smoked graham-flour cake, a torched smear of marshmallow fluff, dark chocolate pudding and graham crackers broken on top. It is obvious and no less pleasurable for it. (Kari Rak, previously at Bouchon Bakery, will introduce a new dessert menu this month.)        \nOr take a shot of moonshine, with an apricot shrub as a chaser. It edges everything in halos and can make you believe that a modern American public house, whatever that is, is where you want to be.        \nDistilled \n211 West Broadway (Franklin Street); (212) 601-9514; distilledny.com.        \nRecommended B.L.T.; chilled charred broccoli; porgy; burger; wings; country fried duck and waffles; pork ribs; smores.        \nPrices \$5 to \$29.        \nOpen Nightly for dinner, Saturday and Sunday for brunch.        \nReservations Accepted.        \nWheelchair access Entrance is up a short flight of stairs from the sidewalk. Restrooms have handrails.        \n\n\n\n \n\n\n\n"



Another way to do this would be to use the core Julia functions to load text. We can push strings into an iterable data structure.


```julia
slist = String[]
for fname in fnames
    s = open(fname) do file
        # read the contents of a file all at once
        read(file, String)
    end
    push!(slist, s)
end
```

metadata for our document can be accesed as a property of the FileDocument instance


```julia
a = fds[1];
a.metadata
```




    TextAnalysis.DocumentMetadata(Languages.English(), "data/5233240838f0d8062fddf624.txt", "Unknown Author", "Unknown Time")



### Tokenization and Stop Words

Next we will be removing stop words and tokenizing the document. Tokens are individual words split on whitespace. Stop words are high frequency words that we want to filter out. These words often have low lexical meaning and they don't help distinguish one text from another. Below I've created my_prepare which takes care of preparation tasks such as stripping punctuation, articles, pronouns, numbers and non-letters. This also removes stopwords. and stems the document which removes morphological affixes to the words leaving only the stem.


```julia
using WordTokenizers
using Languages

set_tokenizer(WordTokenizers.nltk_word_tokenize)

STOPWORDS = stopwords(Languages.English());
```


```julia
"""
my_prepare(text)

Returns prepared text string
"""
function my_prepare(text)
    sd = StringDocument(text)
    prepare!(sd, strip_punctuation
        | strip_articles
        | strip_pronouns
        | strip_numbers
        | strip_non_letters)
    remove_words!(sd, STOPWORDS)
    stem!(sd)
    remove_case!(sd)
    return sd.text
end
```




    my_prepare




```julia
my_prepare(text(fds[1]))
```




    "hey phone are come tonight it moment realiz call distil confirm dinner reserv yes repli cool sound meant distil june corner franklin street west broadway tribeca former home drew niepor layla centrico the belli dancer frozen margarita machin gone effervesc remain so mr niepor hover background guru distil owner time restaurateur nick iovacchini shane lyon chef the space bland handsom dark wood charcoal banquett breathless ceil quasi mediev wheel chandeli crown fire one devot bar drink benjamin wood ladi killer eleg knife twist occasion mope rock shimmer speaker servic confound friend coddl when stood outsid read post menu hurri step hand copi wouldnt crane neck on arriv departur host leapt door the mission statement preced meal we modern american public hous waiter inton unnecessari slight coy mr lyonss ambit yes wing menu jack gochujang korean ferment soybean chile past borrow larder momofuku noodl bar mr lyon there occasion technic flourish watermelon cube cryovac intensifi flavor mushroom surround puff butteri onion soubis aerat isi siphon a tousl dehydr shave bacon adorn sandwich heirloom tomato basil sourdough b l t cours sunflow sprout miss crunch other classic updat upend popcorn dust garlic cumin brewer yeast evok chees snappi pickl ferment gochugaru korean red chile powder pork rib glaze gochujang teas sweet salti border stray direct onion ring batter yuengl beer tapioca flour fri frozen theatric waiter boast brought negat degre fri they arriv nice sturdi sole purpos exist ferri narcot condiment burn scallion cut jalapeo mayonnais sting preserv lime the substanti burger menu modest refrain tell grass fed organ grain finish beef abet finest version tater tot town grate potato cook underdon crisp wondra flour everyth goe diner marvel duck bread fri chicken brazen irresist despit oversweet accompani waffl spongi slab brioch dredg custard french toast even broccoli wanton flung sliver duck bacon pickl watermelon rind fish sauc vinaigrett wait dollop duck fat but liver pt serv plume bake dehydr chicken skin now confront my mission life skinni girl fat mr lyon told tabl he laugh crackl abandon bite the logic meal smore deconstruct fashion hickori smoke graham flour cake torch smear marshmallow fluff dark chocol pud graham cracker broken top it obvious pleasur kari rak previous bouchon bakeri introduc dessert menu month or shot moonshin apricot shrub chaser it edg halo believ modern american public hous whatev distil west broadway franklin street distilledni com recommend b l t chill char broccoli porgi burger wing countri fri duck waffl pork rib smore price open night dinner saturday sunday brunch reserv accept wheelchair access entranc short flight stair sidewalk restroom handrail"



### Bag of Words and TFIDF

Using the TextAnalysis package we will create a DirectoryCorpus to use when constructing counts over the whole corpus. A text corpus is a large body of text.


```julia
crps = DirectoryCorpus("data");
pop!(crps) # remove last item because this is our section_names.csv document
```




    FileDocument("/Users/gmacmillan/projects/Case_study/julia_nlp_case_study/data/section_names.csv", TextAnalysis.DocumentMetadata(Languages.English(), "/Users/gmacmillan/projects/Case_study/julia_nlp_case_study/data/section_names.csv", "Unknown Author", "Unknown Time"))



We can use the standardize inplace function to make sure all the documents in our corpus are standardized to the StringDocument type.


```julia
standardize!(crps, StringDocument)
```

I use some of the preparation steps from my_preparation function above but applied to the entire corpus. These work in-place.


```julia
remove_case!(crps)
prepare!(crps, strip_punctuation
    | strip_articles
    | strip_pronouns
    | strip_numbers
    | strip_non_letters)
remove_words!(crps, STOPWORDS)
stem!(crps)
```

A lexicon is what is going to keep track of the words and the counts associated with each word. The is in the form of a dictionary. Update the lexicon with the convenience function provided by TextAnalysis.


```julia
update_lexicon!(crps)
```


```julia
lexicon(crps)
```




    Dict{String,Int64} with 22718 entries:
      "nuhu"        => 1
      "ironwe"      => 1
      "wintri"      => 2
      "flatb"       => 1
      "economix"    => 2
      "curv"        => 21
      "skylight"    => 4
      "unoffici"    => 5
      "touchpad"    => 1
      "bidder"      => 4
      "whiz"        => 3
      "beckett"     => 5
      "brandt"      => 5
      "apiec"       => 4
      "il"          => 3
      "msnbc"       => 3
      "archiv"      => 25
      "overdos"     => 2
      "ankl"        => 26
      "oedip"       => 1
      "adventur"    => 25
      "acton"       => 1
      "wpp"         => 8
      "recurr"      => 2
      "underground" => 19
      ⋮             => ⋮



If we wish to have a reverse lookup for each word with row index for the document/s in which it appears, we need to create an inverse index. Fortunately, TextAnalysis makes this easy for us.


```julia
update_inverse_index!(crps)
```


```julia
inverse_index(crps)
```




    Dict{String,Array{Int64,1}} with 22718 entries:
      "nuhu"        => [603]
      "ironwe"      => [630]
      "wintri"      => [159, 583]
      "flatb"       => [744]
      "economix"    => [611, 809]
      "curv"        => [23, 47, 51, 272, 284, 422, 493, 522, 559, 575, 584, 599, 61…
      "skylight"    => [360, 376, 530, 634]
      "unoffici"    => [24, 123, 281, 719, 999]
      "touchpad"    => [757]
      "bidder"      => [104, 235, 881]
      "whiz"        => [51, 321, 857]
      "beckett"     => [397, 601, 701, 750, 992]
      "brandt"      => [91, 493, 706, 800, 916]
      "apiec"       => [328, 773, 816, 869]
      "il"          => [234, 833, 939]
      "msnbc"       => [89, 107, 746]
      "archiv"      => [203, 243, 245, 368, 549, 560, 599, 676, 716, 826, 833, 878,…
      "overdos"     => [639, 758]
      "ankl"        => [147, 158, 168, 241, 266, 375, 393, 408, 447, 462, 572, 662,…
      "oedip"       => [2]
      "adventur"    => [2, 41, 174, 198, 211, 233, 238, 341, 386, 405  …  551, 632,…
      "acton"       => [65]
      "wpp"         => [87]
      "recurr"      => [431, 763]
      "underground" => [32, 168, 227, 427, 557, 630, 631, 634, 647, 679, 723, 769, …
      ⋮             => ⋮




```julia
m = DocumentTermMatrix(crps);
```

The DocumentTermMatrix is a struct with properties containing the components necessary to create a term frequency inverse document frequency (tfidf) matrix for the corpus. This will be applied in later procedures involving information retrieval or sentiment analysis.

The document term matrix is stored in a data structure called [SparseMatrixCSC](https://docs.julialang.org/en/v1/stdlib/SparseArrays/index.html). Sparse matrices are distinct from dense matrices in that the only values stores are non-zero values. In julia, zero values can be stored but only manually. Sparse matrices are common in machine learning, such as in data that contains counts and data encodings that map values to n dimensional arrays, because these computationally efficient data structures can elicit performance gains when used by algorithms meant to take advantage of sparsity.

The inverse index also provides us with a count of the number of documents each word appears in. This is known as document frequencies.

To obtain the tfidf matrix we will simply use the function below applied to the document term matrix.


```julia
tfidf = tf_idf(m);
```

### Steps for computing tfidf

What if we want to do all of the above manually?

  1. Create the bag of words (bow), a set of words unique over the corpus. A set is a good datatype for this since it doesn't allow duplicates. At the end you'll want to convert it to a list so that we can deal with our words in a consistent order.


```julia
cleaned_docs = []
bow = Set{String}();
for doc in fds
    cleaned = tokenize(my_prepare((text(doc))))
    union!(bow, Set(cleaned))
    push!(cleaned_docs, cleaned)
end
filter!(!isempty, cleaned_docs);
```

  2. Create a reverse lookup for the vocab list. This is a dictionary whose keys are the words and values are the indices of the words (the word id). This will make things much faster than using the list index function.


```julia
indexer = Dict{String,Int64}()
for (i, word) in enumerate(bow)
    indexer[word] = i
end
```

  3. Create a word count matrix. This is an array data type where each row corresponds to a document and each column a word. The value should be the count of the number of times that word appeared in that document.


```julia
num_docs = length(fds)
num_words = length(indexer);
```


```julia
counts = zeros((num_docs, num_words));
```


```julia
for (idx, doc) in enumerate(cleaned_docs)
    C = Dict{String,Int64}()
    for word in doc
        C[word] = get(C, word, 0) + 1
    end
    for (word, count) in C
        counts[idx, indexer[word]] = count
    end
end
```

  4. Create the document frequencies. For each word, get a count of the number of documents the word appears in. This is different from the total number of times the word appears.


```julia
df = sum(counts, dims=1);
```

  5. Normalize the word count matrix to get the term frequencies. This means dividing each term frequency by the l2 (euclidean) norm. This makes each document vector has a length of 1.


```julia
# document_frequencies
tf_norm = sqrt.(sum(counts .^ 2, dims=2));
tf_norm[tf_norm .== 0] .= 1;
tfs = counts ./ tf_norm;
```

6. Multiply the term frequency matrix by the log of the inverse of the document frequencies to get the tf-idf matrix. We add one to the denominator to avoid dividing by 0.


```julia
idf = log.((num_docs + 1) ./ (1 .+ df)) .+ 1;
tfidf_m = tfs .* idf;
```

7. Normalize the tf-idf matrix as well by dividing by the l2 norm.


```julia
tfidf_norm = sqrt.(sum(tfidf_m .^ 2, dims=2));
tfidf_norm[tfidf_norm .== 0] .= 1;
tfidf_m ./= tfidf_norm;
```

TODO: Fix numbering information for the above steps. The numbers show up as all 1's in github

### Cosine Similarity Using TFIDF

The tfidf approach is common for understanding relative term importances in a document. It is a classic way to encode documents so that arbitrary queries, different forms of clustering and document classification tasks can now be executed. We have a vector space model as the representation of a set of documents. Queries can now be viewed in the same space as the document collection in order to allow for information retrieval.

One way to do scoring of the distance between vectors is by similarity score. Cosine similarity quantifies how much two multidimensional vectors point in the same direction on a scale from 1 (pointing in the same direction) to -1 (pointing in opposite directions). A cosine similarity of 0 means that the vectors are orthogonal. I use the [Distances.jl](https://github.com/JuliaStats/Distances.jl) library to calculate this.


```julia
using Distances
```


```julia
"""
readlines_remove_leading_whitespace(doc)

Returns an array of strings without leading whitespace lines
"""
function my_readlines(doc_title)
    lines = readlines(doc_title)
    i = 1
    while true
        if length(strip(lines[i])) !== 0
            break
        end
        i += 1
    end
    return lines[i:lastindex(lines)]
end


ix_A = 1; doc_A = tfidf[ix_A, :]
ix_B = 589 ; doc_B = tfidf[ix_B, :]
println("\ndocument A: ")
println.(my_readlines(crps[ix_A].metadata.title)[1:5]) # print just 5 lines
println("\ndocument B: ")
println.(my_readlines(crps[ix_B].metadata.title)[1:5]) # print just 5 lines
println("\nCosine Similarity of documents A & B: ")
1 - evaluate(CosineDist(), doc_A, doc_B)
```


    document A:
    Hey, the man on the phone said. Are you still coming tonight?        


    It took a moment for me to realize that he was calling from Distilled to confirm my dinner reservation.        
    Yes, I replied. Cool, he said, and sounded as if he meant it.        

    document B:
    The last time we tasted mencas from Bierzo, Spain, my recipe included rosemary, the wines dominant herbal note. Consistency may be someone elses hobgoblin, but its nice to see it in wines; there was that rosemary again.        
    Pairings often welcome contrasts, but this time I picked up the flavors and aromas of the wine and tossed them into the pan. Green peppers, a hit of chile, olives and a beefy smoke. All have been incorporated in this dish.        




    Cosine Similarity of documents A & B:





    0.028020811811042434



If we want to compute the pairwise distance between all documents simultaneously, we can do that using the pairwise function from Distances.jl.


```julia
r = zeros((num_docs, num_docs));
@time pairwise!(r, CosineDist(), transpose(tfidf), dims=2);
```

     28.617698 seconds (2.52 M allocations: 110.963 MiB, 0.17% gc time)



```julia
println("Similarity measure pairwise: ")
1 .- r
```

    Similarity measure pairwise:





    999×999 Array{Float64,2}:
     1.0         0.0207873   0.0153      …  0.00754566  0.0156072   0.00758319
     0.0207873   1.0         0.0136661      0.0189835   0.0316948   0.0200642
     0.0153      0.0136661   1.0            0.018636    0.0193947   0.0231317
     0.047558    0.050975    0.0118592      0.0125809   0.0156882   0.0181751
     0.0895226   0.0314027   0.0172356      0.00877987  0.016188    0.00906719
     0.0627999   0.00912273  0.00434174  …  0.0244229   0.00867607  0.0144011
     0.0113251   0.00990173  0.0127414      0.0132327   0.037472    0.0323638
     0.0131596   0.0066572   0.0140031      0.0192138   0.0185132   0.0222539
     0.00620686  0.0139168   0.00896439     0.35506     0.0228831   0.0416952
     0.00730156  0.0116336   0.0103688      0.0137953   0.0483865   0.0080328
     0.054077    0.00438495  0.00160449  …  0.00442205  0.0088396   0.0113539
     0.00400843  0.00899478  0.00707497     0.0945006   0.0080607   0.256313  
     0.0244169   0.0117918   0.0110578      0.0393377   0.0297933   0.0250035
     ⋮                                   ⋱                                    
     0.00794945  0.012802    0.0117469      0.0345667   0.0179843   0.0684676
     0.00872418  0.0229245   0.0256943      0.0133643   0.0227482   0.0117453
     0.00780102  0.00819876  0.0145026      0.0116803   0.0150731   0.00816288
     0.0110392   0.00678634  0.00443852  …  0.0317835   0.0223228   0.0220557
     0.0185624   0.0143821   0.014936       0.0112221   0.0321573   0.0177684
     0.00954421  0.00613039  0.0112613      0.0266921   0.00133801  0.0369548
     0.0151518   0.00557817  0.0166722      0.0127879   0.00899566  0.0288063
     0.00818376  0.00588771  0.0102004      0.0153659   0.0416719   0.0120247
     0.00384303  0.00421517  0.00990962  …  0.0150054   0.00692421  0.0363021
     0.00754566  0.0189835   0.018636       1.0         0.0309683   0.0790843
     0.0156072   0.0316948   0.0193947      0.0309683   1.0         0.0392533
     0.00758319  0.0200642   0.0231317      0.0790843   0.0392533   1.0       



### Feature Importances: Applications of tfidf

Given a corpus of documents, related to each other or not, we can use the tfidf score to rank words in order of importance to the text. We can also just use the word frequencies by passing in the term frequency sparse matrix instead.


```julia
"""
Returns top n tfidf values in row and return them with their corresponding feature names
"""
function get_top_tfidf_feats(row, features, top_n::Int64=10)
    if length(row) > top_n
        top_idxs = sortperm(row, rev=true)[1:top_n]
    else
        top_idxs = sortperm(row, rev=true)
    end
    return [(features[i], row[i]) for i in top_idxs]
end
```




    get_top_tfidf_feats




```julia
"""
Returns top tfidf features in specific document (matrix row)
"""
function get_top_feats_in_doc(X_sparse, features, row_id::Int64, top_n::Int64=10)
    get_top_tfidf_feats(X_sparse[row_id, :], features, top_n)
end
```




    get_top_feats_in_doc




```julia
feature_array = collect(keys(crps.lexicon));
```


```julia
# top 10 words for document 23
get_top_feats_in_doc(tfidf, feature_array, 23)
```




    10-element Array{Tuple{String,Float64},1}:
     ("carr", 0.0837980511755615)        
     ("wayward", 0.067933919942415)      
     ("paperback", 0.055194433110973204)
     ("laboratorio", 0.05197697721460046)
     ("rein", 0.051330724026278404)      
     ("strength", 0.04892547199630457)   
     ("longitudin", 0.04666726201789564)
     ("make", 0.04400478467419274)       
     ("wrink", 0.04198383512222033)      
     ("pari", 0.03963874160568814)       




```julia
using StatsBase # import StatsBase to use the mean function

"""
Returns the top n features that on average are most important amongst documents in rows
indentified by indices in grp_ids
"""
function get_top_mean_feats(X_sparse, features, grp_ids=nothing, top_n::Int64=10)
    if isnothing(grp_ids)
        D = X_sparse
    else
        D = X_sparse[grp_ids, :]
    end
    tfidf_means = vec(mean(D, dims=1))
    return get_top_tfidf_feats(tfidf_means, features, top_n)
end
```

    WARNING: using StatsBase.counts in module Main conflicts with an existing identifier.





    get_top_mean_feats




```julia
get_top_mean_feats(tfidf, feature_array)
```




    10-element Array{Tuple{String,Float64},1}:
     ("unfulfil", 0.004298837611037763)   
     ("earthflight", 0.003694854911730176)
     ("paperback", 0.0036727650633894353)
     ("rebound", 0.0035198602372548795)   
     ("lama", 0.003464234955213334)       
     ("uneas", 0.003222486091908161)      
     ("scholar", 0.0031950129131286284)   
     ("schonberg", 0.003039835421215477)  
     ("zz", 0.003027595424161008)         
     ("dire", 0.0029909884549977864)      



### Using JuliaDB with Labeled Data

So far we’ve only considered words as individual units, and considered their relationships to the larger corpus of documents. Many interesting features can be found by performing text analyses based on the relationships between words and examining which words tend to follow others immediately, or that tend to co-occur within the same documents.

Lets say we want to confirm our hypothesis that documents from different New York Times news sections have different combinations of words. I use JuliaDB to load data from *section_names.csv* and combine this data with our texts. I then create different corpora used for finding top bigram features.


```julia
using JuliaDB
```


```julia
col_names = ["id", "section"]
sections_table = loadtable("data/section_names.csv"; header_exists=false, colnames=col_names);
# reindex has inplace function
sections_table = reindex(sections_table, :id);
```


```julia
# create a mask for just the text in the book section
msk_books = select(sections_table, :section => x -> x == "Books" );
```


```julia
bi_grams = NGramDocument.(text.(crps), 2);
```


```julia
bi_gram_crps = Corpus(bi_grams)
update_lexicon!(bi_gram_crps) # update our bigram lexicon
```


```julia
tfidf2 = tf_idf(DocumentTermMatrix(bi_gram_crps));
feature_array2 = collect(keys(bi_gram_crps.lexicon));
```


```julia
# "10 most important words by mean tfidf score in Books sections: "
get_top_mean_feats(tfidf2, feature_array2, findall(!!, msk_books), 20)
```




    20-element Array{Tuple{String,Float64},1}:
     ("approv keyston", 0.012769003009089008)
     ("dan mccabe", 0.009084626784167946)    
     ("nw washington", 0.008826231299062898)
     ("lemon garnish", 0.006859985948229485)
     ("colleg game", 0.006457915014267387)   
     ("book regain", 0.005745935812141618)   
     ("list rentbro", 0.005745935812141618)  
     ("ban agenc", 0.005617242437875209)     
     ("honey", 0.004994429413701268)         
     ("historian name", 0.004977841281908868)
     ("art park", 0.004830438541265002)      
     ("greav", 0.004380921925796904)         
     ("miss proposit", 0.004340074866415672)
     ("justin bieber", 0.004302304441744708)
     ("jasper tex", 0.004211579209546832)    
     ("attend colleg", 0.004065387616803975)
     ("prison serv", 0.00390747355666676)    
     ("wipe entir", 0.003862566285592531)    
     ("design elicit", 0.0037377902666676363)
     ("wife peopl", 0.003494950648622221)    




```julia
msk_sports = select(sections_table, :section => x -> x == "Sports" );
```


```julia
# "10 most important words by mean tfidf score in Sports sections: "
get_top_mean_feats(tfidf2, feature_array2, findall(!!, msk_sports), 20) # !! is a double negator
```




    20-element Array{Tuple{String,Float64},1}:
     ("economist depart", 0.011148866380634209)    
     ("tablespoon chinkiang", 0.008779464262457137)
     ("concert half", 0.008471186667189075)        
     ("lead downtown", 0.007550361586371777)       
     ("suppos braini", 0.006811770657058267)       
     ("hop guest", 0.006192600712560494)           
     ("judg ive", 0.005836589364014666)            
     ("afghan relat", 0.005685508385988465)        
     ("bootsi collin", 0.005682484391653045)       
     ("scene depriv", 0.00536856407437897)         
     ("five card", 0.005312194038379561)           
     ("plan improv", 0.004952347354472934)         
     ("accolad", 0.00478566813792554)              
     ("wine vegan", 0.004778521884857718)          
     ("receiv call", 0.004675518934544374)         
     ("watch liriano", 0.004577184649360663)       
     ("support republ", 0.0045527193515291125)     
     ("mystic invent", 0.004533042470476335)       
     ("seddiqi disput", 0.004482410268596228)      
     ("bronx identifi", 0.0041501025347195665)     



### Ranking Document Relevance using Cosine Similarity


```julia
queries_text = readlines("queries.txt");
```


```julia
q_crps = Corpus(StringDocument.(my_prepare.(queries_text)));
q_tfidf = tf_idf(dtm(DocumentTermMatrix(q_crps, crps.lexicon)));
```


```julia
function print_result(crps, row_id::Int64, num_lines::Int64=5)
    println("\n")
    println.(my_readlines(crps[row_id].metadata.title)[1:num_lines])
    println("...\n")
    return
end
```




    print_result (generic function with 2 methods)




```julia
function get_similar_documents(x, top_n::Int64=3)
    arr = []
    for i in 1:tfidf.m
        relevance = 1 - evaluate(CosineDist(), tfidf[i,:], x)
        push!(arr, relevance)
    end

    filter!(!isnan, arr);
    l = lastindex(sortperm(arr))
    print("\nsearch results:\n ")
    [print_result(crps, sortperm(arr)[i]) for i in l - top_n:l];
end
```




    get_similar_documents (generic function with 2 methods)




```julia
function search(query_idx, top_n::Int64=3)
    print("\nquery\n: ")
    print(queries_text[query_idx])
    get_similar_documents(q_tfidf[query_idx, :], top_n)
    return
end
```




    search (generic function with 2 methods)




```julia
search(7)
```


    query
    : Watching the Game of Thrones contingent take their final (and somewhat complicated) bow this weekend at Comic-Con International I found myself wondering: Will we ever see the likes of the HBO hit series again? Fans will continue to debate the creative choices made in the finale season but the overall accomplishment of David Benioff & D.B. Weiss and their writing staff was truly staggering. They not only delivered the most stirring fantasy epic since Peter Jackson’s The Lord of The Rings they did it on a weekly basis and with nuances that made the sword-and-sorcery show a must-see favorite even among non-fantasy fans.
    search results:


    AMC wants more Dead and who could be surprised?         
    The Walking Dead, the top show in television among the advertiser-preferred group of viewers between the ages of 18 and 49 is going to get what AMC is calling a companion series, with an expected airdate sometime in 2015.        
    The network announced on Monday that Robert Kirkman, who wrote the comic book series that inspired the television show, will develop the new version, which is still untitled. It will, fans will be happy to note, feature zombies.        
    In a statement, Mr. Kirkman said, The opportunity to make a show that isnt tethered by the events of the comic book, and is truly a blank page, has set my creativity racing.        
    Other members of the Walking Dead creative team, including the producers Gale Anne Hurd and David Alpert, will be involved in the new effort as well.        
    ...



    When the Mets moved into Citi Field five years ago, they were also, as it turned out, settling into fourth place in the National League East and making themselves comfortable. If their season ended Friday, they would finish in that very undistinguished spot for the fifth straight season. It would be a franchise record, dubious as it might seem, for never in their uphill history have they ended up staying in the same place for so long.        


    Even in the 1960s, when the Mets made a name for themselves as one of the worst teams in baseball history, they finished 10th, and last, only in their first four years of existence. In the fifth year, 1966, they finished next to last, in ninth.        
    In baseballs current division format, fourth is the new ninth, a home for teams that are usually overmatched and not going anywhere in particular. That certainly describes the current Mets, who have now been in fourth place long enough to buy a new recliner, hang up some pictures and get to know the neighbors (hello, Miami Marlins).        
    ...



    FLORHAM PARK, N.J.  When Rex Ryan was hired to coach the Jets in 2009, he insisted on running effectively, a philosophy that he captured in the catchphrase ground and pound. Even as the Jets develop Geno Smith, a rookie quarterback who understandably lacks polish, that is no longer Ryans mantra.        


    Do I expect us to run more than pass? Not really, Ryan said after Thursdays practice. Id like to be close to balanced. I think thats where weve been the first couple of games. So I think thats pretty good.        
    The Jets, who will host the Buffalo Bills on Sunday in a meeting of A.F.C. East teams with 1-1 records, have attempted 74 passes and 61 rushes. Smith dropped back 42 times in a 13-10 loss at the New England Patriots on Sept. 12 in a game that raised questions about how committed Marty Mornhinweg, the new offensive coordinator, would be to the run. The Jets backed off the ground game despite rushing 32 times for 129 yards; Smith threw three interceptions in the fourth quarter.        
    ...



                                Several times in Rush, Ron Howards excitingly torqued movie set in the Formula One race world, the camera gets so close to a drivers eye that you can see each trembling lash. Its a startlingly beautiful but also naked image, partly because theres no hiding for an actor when the camera gets that close. In moments like these, youre no longer watching a performance with its layers of art and technique: youve crossed the border between fiction and documentary to go eye to eye with another persons nervous system. Mr. Howard doesnt just want you to crawl inside a Formula One racecar, he also wants you to crawl inside its drivers head.        


                                Specifically, he wants to get inside those of James Hunt (Chris Hemsworth) and Niki Lauda (Daniel Brhl), Formula One titans and rivals, who, in 1976, helped push the sport into mainstream consciousness. (Well, at least in much of the rest of the world: Formula One has long struggled in the United States.) In 1976, when both men were in their late 20s, they raced after each other while chasing the world championship over wet, dry and terrifyingly gnarly tracks. Tucked, very much alone, into open-wheel machines that could easily have become coffins, Hunt and Lauda cut corners and grazed death lap after lap  whooshing over racetracks, city streets and deceptively pastoral roads into the sort of sports legend that translates only occasionally into good cinema.        

    ...



### Wrapping Up

My notebook showed a text analysis approach that is useful for exploring the relationships and connections between words. Relationships involving n-grams, which help to see what words tend to appear after others, or co-occurences can help us find which terms are most important to a document. It is my aim to convey that Julia, as a tool for text analysis, is just as flexible as Python and that it will play an important role in the work data scientists do moving forward.
