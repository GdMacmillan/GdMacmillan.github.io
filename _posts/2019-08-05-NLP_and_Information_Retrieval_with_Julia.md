---
layout: article
title: NLP and Information Retrieval with Julia
coverPhoto: /assets/posts/2019-08-05/text_classification_workflow.png
---

<!-- <p><img src="{{ site.baseurl }}/assets/posts/2019-08-05/text_classification_workflow.png" alt="pipes" /></p> -->

## Purpose

We are going to talk about a topic often talked about in the context of Python. With many well supported packages and a vibrant community of developers around them, why wouldn't we use Python? Well, the simplicity and user friendly syntax of Julia along with the ability to run as fast as C at compile time, would seme like a good reason for one. So how good is Julia when the task is understanding the naturual language and it's subtleties? We are going to take a look below. Code for the following can be found here:
[https://github.com/GdMacmillan/Julia-NLP-and-Information-Retrieval](https://github.com/GdMacmillan/Julia-NLP-and-Information-Retrieval)

## Setup

The data source is usually a document database such as MongoDB. I have started a client with a local mongo service and loaded the data from a json document that is supposed to mimic the real-life document one might recieve from a web scraper. I will not go into how to do this with this tutorial so lets assume the documents are already loaded in a local Mongo service.

### Loading Data from Mongo

For my pipeline, I want to extract the text content from my database to flat files (txt) located in a directory called data. I also will write a section_names.csv file with the ids and names of the sections. To do this I will call a python script, aptly called load_nyt_data.py. I did this in python as I already had pymongo installed and the main goal is to perform common nlp tasks with julia, not implement python code. Number of files written will be 0 if files already exist locally.

<pre class='hljl'>
<span class='hljl-nf'>run</span><span class='hljl-p'>(</span><span class='hljl-sb'>`python src/load_nyt_data.py`</span><span class='hljl-p'>)</span>
</pre>

Number of files written:  0

<pre class="julia-error">
Process&#40;&#96;python src/load_nyt_data.py&#96;, ProcessExited&#40;1&#41;&#41; &#91;1&#93;
</pre>

## Text Processing Pipeline

The goal is to build a basic text processing pipeline involving tokenization, stripping stopwords and stemming. Ultimately what we want is a sparse representation of the data where 1 row of data is a document and each column is a unique term, such as a unigram, bigram or trigram. The values herein will be generated from a vectorization method which assigns each document term a value which is proportional to its frequency in the document, but inversely proportional to the number of documents in which it occurs.

### Load data using TextAnalysis and Glob

The main package we will be using for this pipeline is [Text Analysis](https://github.com/JuliaText/TextAnalysis.jl). Text analysis is supported by the [JuliaText organization](https://github.com/JuliaText) and parallels several supported packages for working with data in the form of text.

<pre class='hljl'>
<span class='hljl-k'>using</span><span class='hljl-t'> </span><span class='hljl-n'>TextAnalysis</span><span class='hljl-t'>
</span><span class='hljl-k'>using</span><span class='hljl-t'> </span><span class='hljl-n'>Glob</span>
</pre>

Create an array of filenames

<pre class='hljl'>
<span class='hljl-n'>fnames</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>glob</span><span class='hljl-p'>(</span><span class='hljl-s'>&quot;data/*.txt&quot;</span><span class='hljl-p'>);</span>
</pre>

Read an example file

<pre class='hljl'>
<span class='hljl-cs'># example file</span><span class='hljl-t'>
</span><span class='hljl-nf'>readlines</span><span class='hljl-p'>(</span><span class='hljl-n'>fnames</span><span class='hljl-p'>[</span><span class='hljl-ni'>1</span><span class='hljl-p'>])</span>
</pre>

<pre class="output">
42-element Array&#123;String,1&#125;:
 &quot;&quot;

 &quot;&quot;

 &quot;&quot;

 &quot;&quot;

 &quot;&quot;

 &quot;&quot;

 &quot;&quot;

 &quot;&quot;

 &quot;&quot;

 &quot;&quot;

 ⋮

 &quot;Reservations Accepted.        &quot;

 &quot;Wheelchair access Entrance is up a short flight of stairs from the sidewa
lk. Restrooms have handrails.        &quot;
 &quot;&quot;

 &quot;&quot;

 &quot;&quot;

 &quot; &quot;

 &quot;&quot;

 &quot;&quot;

 &quot;&quot;
</pre>

We can also map a file document type to the filenames in fnames. This produces an array of FileDocuments.

<pre class='hljl'>
<span class='hljl-n'>fds</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>map</span><span class='hljl-p'>(</span><span class='hljl-n'>FileDocument</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>fnames</span><span class='hljl-p'>);</span>
</pre>

We can read a file using the text function.

<pre class='hljl'>
<span class='hljl-nf'>text</span><span class='hljl-p'>(</span><span class='hljl-n'>fds</span><span class='hljl-p'>[</span><span class='hljl-ni'>1</span><span class='hljl-p'>])</span>
</pre>

<pre class="output">
&quot;\n\n\n\n\n\n\n\n\n\n\nHey, the man on the phone said. Are you still coming
 tonight?        \n \n\nIt took a moment for me to realize that he was call
ing from Distilled to confirm my dinner reservation.        \nYes, I replie
d. Cool, he said, and sounded as if he meant it.        \nDistilled opened
in June on the corner of Franklin Street and West Broadway in TriBeCa, the
former home of Drew Nieporents Layla and Centrico. The belly dancers and th
e frozen-margarita machine are gone, but a certain effervescence remains. S
o does Mr. Nieporent, hovering in the background as guru to Distilleds owne
rs, the first-time restaurateur Nick Iovacchini and Shane Lyons, the 25-yea
r-old chef.        \nThe space is blandly handsome, with dark woods and cha
rcoal banquettes, breathlessly high ceilings and quasi-medieval wheel chand
eliers like crowns of fire. One side is devoted to the bar, where the drink
s, by Benjamin Wood, are lady-killers, elegant with a knife twist. Occasion
ally 1980s mope rock shimmers from the speakers.        \nService is confou
ndingly friendly, almost coddling. When I stood outside reading the posted
menu, someone came hurrying down the steps to hand me my own copy, so I wou
ldnt crane my neck, he said. On arrival and departure, a host leapt to open
 the door.        \nThe mission statement that preceded one meal &#40;We are a
modern American public house, the waiter intoned&#41; was both unnecessary and
slightly coy about Mr. Lyonss ambitions. Yes, wings are on the menu, but th
ey are jacked up with gochujang, Korean fermented soybean and chile paste
borrowed, perhaps, from the larder at Momofuku Noodle Bar, where Mr. Lyons
worked for a year.        \nThere are occasional technical flourishes, like
 watermelon cubes Cryovaced to intensify their flavor, and mushrooms surrou
nded by puffs of buttery onion soubise, aerated by an iSi siphon. A tousle
of dehydrated and shaved bacon adorns an open-face sandwich of heirloom tom
atoes and basil on sourdough: a B.L.T., of course. Sunflower sprouts make u
p for the missing crunch.        \nOther classics are updated rather than u
pended: popcorn dusted with garlic, cumin and brewers yeast, which evokes c
heese; snappy pickles fermented with gochugaru, Korean red chile powder; po
rk ribs glazed with more gochujang, teasing the sweet-salty border without
straying too far in either direction.        \nOnion rings, battered with Y
uengling beer and tapioca flour, are fried, then frozen &#40;a theatrical waite
r boasted that they had been brought to negative 60 degrees&#41; and fried agai
n. They arrive nicely sturdy, the sole purpose of their existence to ferry
the narcotic-like condiments, burned scallions cut with jalapeos and mayonn
aise with the sting of preserved lime.        \nThe substantial burger &#40;whi
ch the menu modestly refrains from telling you is made with grass-fed, orga
nic-grain-finished beef&#41; is abetted by what may be the finest version of Ta
ter Tots in town, the grated potatoes cooked until just underdone and then
crisped with Wondra flour.        \nEverything here goes to 11, one diner m
arveled. Duck breaded and fried like chicken is brazen and irresistible, de
spite the oversweet accompanying waffle, a spongy slab of brioche dredged i
n custard, like French toast. Even broccoli turns wanton, flung with sliver
s of duck bacon and pickled watermelon rind in a fish sauce vinaigrette, wi
th &#40;wait for it&#41; a dollop of duck fat.        \nBut liver pt served with pl
umes of baked, dehydrated chicken skin? Now this is confrontational. My mis
sion in life is to make skinny girls fat, Mr. Lyons told my table. He got a
 laugh, but the cracklings were abandoned after one bite.        \nThe only
 logical end to such a meal is smores  deconstructed, as is the fashion, wi
th a hickory-smoked graham-flour cake, a torched smear of marshmallow fluff
, dark chocolate pudding and graham crackers broken on top. It is obvious a
nd no less pleasurable for it. &#40;Kari Rak, previously at Bouchon Bakery, wil
l introduce a new dessert menu this month.&#41;        \nOr take a shot of moon
shine, with an apricot shrub as a chaser. It edges everything in halos and
can make you believe that a modern American public house, whatever that is,
 is where you want to be.        \nDistilled \n211 West Broadway &#40;Franklin
Street&#41;; &#40;212&#41; 601-9514; distilledny.com.        \nRecommended B.L.T.; chil
led charred broccoli; porgy; burger; wings; country fried duck and waffles;
 pork ribs; smores.        \nPrices \&#36;5 to \&#36;29.        \nOpen Nightly for
dinner, Saturday and Sunday for brunch.        \nReservations Accepted.
    \nWheelchair access Entrance is up a short flight of stairs from the si
dewalk. Restrooms have handrails.        \n\n\n\n \n\n\n\n&quot;
</pre>

Another way to do this would be to use the core Julia functions to load text. We can push strings into an iterable data structure.

<pre class='hljl'>
<span class='hljl-n'>slist</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-n'>String</span><span class='hljl-p'>[]</span><span class='hljl-t'>
</span><span class='hljl-k'>for</span><span class='hljl-t'> </span><span class='hljl-n'>fname</span><span class='hljl-t'> </span><span class='hljl-kp'>in</span><span class='hljl-t'> </span><span class='hljl-n'>fnames</span><span class='hljl-t'>
    </span><span class='hljl-n'>s</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>open</span><span class='hljl-p'>(</span><span class='hljl-n'>fname</span><span class='hljl-p'>)</span><span class='hljl-t'> </span><span class='hljl-k'>do</span><span class='hljl-t'> </span><span class='hljl-n'>file</span><span class='hljl-t'>
        </span><span class='hljl-cs'># read the contents of a file all at once</span><span class='hljl-t'>
        </span><span class='hljl-nf'>read</span><span class='hljl-p'>(</span><span class='hljl-n'>file</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>String</span><span class='hljl-p'>)</span><span class='hljl-t'>
    </span><span class='hljl-k'>end</span><span class='hljl-t'>
    </span><span class='hljl-nf'>push!</span><span class='hljl-p'>(</span><span class='hljl-n'>slist</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>s</span><span class='hljl-p'>)</span><span class='hljl-t'>
</span><span class='hljl-k'>end</span>
</pre>

metadata for our document can be accesed as a property of the FileDocument instance

<pre class='hljl'>
<span class='hljl-n'>a</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-n'>fds</span><span class='hljl-p'>[</span><span class='hljl-ni'>1</span><span class='hljl-p'>];</span><span class='hljl-t'>
</span><span class='hljl-n'>a</span><span class='hljl-oB'>.</span><span class='hljl-n'>metadata</span>
</pre>

<pre class="output">
TextAnalysis.DocumentMetadata&#40;Languages.English&#40;&#41;, &quot;data/5233240838f0d8062f
ddf624.txt&quot;, &quot;Unknown Author&quot;, &quot;Unknown Time&quot;&#41;
</pre>

### Tokenization and Stop Words

Next we will be removing stop words and tokenizing the document. Tokens are individual words split on whitespace. Stop words are high frequency words that we want to filter out. These words often have low lexical meaning and they don&#39;t help distinguish one text from another. Below I&#39;ve created my_prepare which takes care of preparation tasks such as stripping punctuation, articles, pronouns, numbers and non-letters. This also removes stopwords. and stems the document which removes morphological affixes to the words leaving only the stem.

<pre class='hljl'>
<span class='hljl-k'>using</span><span class='hljl-t'> </span><span class='hljl-n'>WordTokenizers</span><span class='hljl-t'>
</span><span class='hljl-k'>using</span><span class='hljl-t'> </span><span class='hljl-n'>Languages</span><span class='hljl-t'>

</span><span class='hljl-nf'>set_tokenizer</span><span class='hljl-p'>(</span><span class='hljl-n'>WordTokenizers</span><span class='hljl-oB'>.</span><span class='hljl-n'>nltk_word_tokenize</span><span class='hljl-p'>)</span><span class='hljl-t'>

</span><span class='hljl-n'>STOPWORDS</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>stopwords</span><span class='hljl-p'>(</span><span class='hljl-n'>Languages</span><span class='hljl-oB'>.</span><span class='hljl-nf'>English</span><span class='hljl-p'>());</span>
</pre>

<pre class='hljl'>
<span class='hljl-s'>&quot;&quot;&quot;
my_prepare(text)

Returns prepared text string
&quot;&quot;&quot;</span><span class='hljl-t'>
</span><span class='hljl-k'>function</span><span class='hljl-t'> </span><span class='hljl-nf'>my_prepare</span><span class='hljl-p'>(</span><span class='hljl-n'>text</span><span class='hljl-p'>)</span><span class='hljl-t'>
    </span><span class='hljl-n'>sd</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>StringDocument</span><span class='hljl-p'>(</span><span class='hljl-n'>text</span><span class='hljl-p'>)</span><span class='hljl-t'>
    </span><span class='hljl-nf'>prepare!</span><span class='hljl-p'>(</span><span class='hljl-n'>sd</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>strip_punctuation</span><span class='hljl-t'>
        </span><span class='hljl-oB'>|</span><span class='hljl-t'> </span><span class='hljl-n'>strip_articles</span><span class='hljl-t'>
        </span><span class='hljl-oB'>|</span><span class='hljl-t'> </span><span class='hljl-n'>strip_pronouns</span><span class='hljl-t'>
        </span><span class='hljl-oB'>|</span><span class='hljl-t'> </span><span class='hljl-n'>strip_numbers</span><span class='hljl-t'>
        </span><span class='hljl-oB'>|</span><span class='hljl-t'> </span><span class='hljl-n'>strip_non_letters</span><span class='hljl-p'>)</span><span class='hljl-t'>
    </span><span class='hljl-nf'>remove_words!</span><span class='hljl-p'>(</span><span class='hljl-n'>sd</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>STOPWORDS</span><span class='hljl-p'>)</span><span class='hljl-t'>
    </span><span class='hljl-nf'>stem!</span><span class='hljl-p'>(</span><span class='hljl-n'>sd</span><span class='hljl-p'>)</span><span class='hljl-t'>
    </span><span class='hljl-nf'>remove_case!</span><span class='hljl-p'>(</span><span class='hljl-n'>sd</span><span class='hljl-p'>)</span><span class='hljl-t'>
    </span><span class='hljl-k'>return</span><span class='hljl-t'> </span><span class='hljl-n'>sd</span><span class='hljl-oB'>.</span><span class='hljl-n'>text</span><span class='hljl-t'>
</span><span class='hljl-k'>end</span>
</pre>

<pre class="output">
my_prepare
</pre>

<pre class='hljl'>
<span class='hljl-nf'>my_prepare</span><span class='hljl-p'>(</span><span class='hljl-nf'>text</span><span class='hljl-p'>(</span><span class='hljl-n'>fds</span><span class='hljl-p'>[</span><span class='hljl-ni'>1</span><span class='hljl-p'>]))</span>
</pre>

<pre class="output">
&quot;hey phone are come tonight it moment realiz call distil confirm dinner res
erv yes repli cool sound meant distil june corner franklin street west broa
dway tribeca former home drew niepor layla centrico the belli dancer frozen
 margarita machin gone effervesc remain so mr niepor hover background guru
distil owner time restaurateur nick iovacchini shane lyon chef the space bl
and handsom dark wood charcoal banquett breathless ceil quasi mediev wheel
chandeli crown fire one devot bar drink benjamin wood ladi killer eleg knif
e twist occasion mope rock shimmer speaker servic confound friend coddl whe
n stood outsid read post menu hurri step hand copi wouldnt crane neck on ar
riv departur host leapt door the mission statement preced meal we modern am
erican public hous waiter inton unnecessari slight coy mr lyonss ambit yes
wing menu jack gochujang korean ferment soybean chile past borrow larder mo
mofuku noodl bar mr lyon there occasion technic flourish watermelon cube cr
yovac intensifi flavor mushroom surround puff butteri onion soubis aerat is
i siphon a tousl dehydr shave bacon adorn sandwich heirloom tomato basil so
urdough b l t cours sunflow sprout miss crunch other classic updat upend po
pcorn dust garlic cumin brewer yeast evok chees snappi pickl ferment gochug
aru korean red chile powder pork rib glaze gochujang teas sweet salti borde
r stray direct onion ring batter yuengl beer tapioca flour fri frozen theat
ric waiter boast brought negat degre fri they arriv nice sturdi sole purpos
 exist ferri narcot condiment burn scallion cut jalapeo mayonnais sting pre
serv lime the substanti burger menu modest refrain tell grass fed organ gra
in finish beef abet finest version tater tot town grate potato cook underdo
n crisp wondra flour everyth goe diner marvel duck bread fri chicken brazen
 irresist despit oversweet accompani waffl spongi slab brioch dredg custard
 french toast even broccoli wanton flung sliver duck bacon pickl watermelon
 rind fish sauc vinaigrett wait dollop duck fat but liver pt serv plume bak
e dehydr chicken skin now confront my mission life skinni girl fat mr lyon
told tabl he laugh crackl abandon bite the logic meal smore deconstruct fas
hion hickori smoke graham flour cake torch smear marshmallow fluff dark cho
col pud graham cracker broken top it obvious pleasur kari rak previous bouc
hon bakeri introduc dessert menu month or shot moonshin apricot shrub chase
r it edg halo believ modern american public hous whatev distil west broadwa
y franklin street distilledni com recommend b l t chill char broccoli porgi
 burger wing countri fri duck waffl pork rib smore price open night dinner
saturday sunday brunch reserv accept wheelchair access entranc short flight
 stair sidewalk restroom handrail&quot;
</pre>

### Bag of Words and TFIDF

Using the TextAnalysis package we will create a DirectoryCorpus to use when constructing counts over the whole corpus. A text corpus is a large body of text.

<pre class='hljl'>
<span class='hljl-n'>crps</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>DirectoryCorpus</span><span class='hljl-p'>(</span><span class='hljl-s'>&quot;data&quot;</span><span class='hljl-p'>);</span><span class='hljl-t'>
</span><span class='hljl-nf'>pop!</span><span class='hljl-p'>(</span><span class='hljl-n'>crps</span><span class='hljl-p'>)</span><span class='hljl-t'> </span><span class='hljl-cs'># remove last item because this is our section_names.csv document</span>
</pre>

<pre class="output">
TextAnalysis.FileDocument&#40;&quot;/Users/gmacmillan/projects/Case_study/julia_nlp_
case_study/data/section_names.csv&quot;, TextAnalysis.DocumentMetadata&#40;Languages
.English&#40;&#41;, &quot;/Users/gmacmillan/projects/Case_study/julia_nlp_case_study/dat
a/section_names.csv&quot;, &quot;Unknown Author&quot;, &quot;Unknown Time&quot;&#41;&#41;
</pre>

We can use the standardize inplace function to make sure all the documents in our corpus are standardized to the StringDocument type.

<pre class='hljl'>
<span class='hljl-nf'>standardize!</span><span class='hljl-p'>(</span><span class='hljl-n'>crps</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>StringDocument</span><span class='hljl-p'>)</span>
</pre>

I use some of the preparation steps from my_preparation function above but applied to the entire corpus. These work in-place.

<pre class='hljl'>
<span class='hljl-nf'>remove_case!</span><span class='hljl-p'>(</span><span class='hljl-n'>crps</span><span class='hljl-p'>)</span><span class='hljl-t'>
</span><span class='hljl-nf'>prepare!</span><span class='hljl-p'>(</span><span class='hljl-n'>crps</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>strip_punctuation</span><span class='hljl-t'>
    </span><span class='hljl-oB'>|</span><span class='hljl-t'> </span><span class='hljl-n'>strip_articles</span><span class='hljl-t'>
    </span><span class='hljl-oB'>|</span><span class='hljl-t'> </span><span class='hljl-n'>strip_pronouns</span><span class='hljl-t'>
    </span><span class='hljl-oB'>|</span><span class='hljl-t'> </span><span class='hljl-n'>strip_numbers</span><span class='hljl-t'>
    </span><span class='hljl-oB'>|</span><span class='hljl-t'> </span><span class='hljl-n'>strip_non_letters</span><span class='hljl-p'>)</span><span class='hljl-t'>
</span><span class='hljl-nf'>remove_words!</span><span class='hljl-p'>(</span><span class='hljl-n'>crps</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>STOPWORDS</span><span class='hljl-p'>)</span><span class='hljl-t'>
</span><span class='hljl-nf'>stem!</span><span class='hljl-p'>(</span><span class='hljl-n'>crps</span><span class='hljl-p'>)</span>
</pre>

A lexicon is what is going to keep track of the words and the counts associated with each word. The is in the form of a dictionary. Update the lexicon with the convenience function provided by TextAnalysis.

<pre class='hljl'>
<span class='hljl-nf'>update_lexicon!</span><span class='hljl-p'>(</span><span class='hljl-n'>crps</span><span class='hljl-p'>)</span>
</pre>

<pre class='hljl'>
<span class='hljl-nf'>lexicon</span><span class='hljl-p'>(</span><span class='hljl-n'>crps</span><span class='hljl-p'>)</span>
</pre>

<pre class="output">
Dict&#123;String,Int64&#125; with 22718 entries:
  &quot;nuhu&quot;     &#61;&gt; 1
  &quot;ironwe&quot;   &#61;&gt; 1
  &quot;wintri&quot;   &#61;&gt; 2
  &quot;flatb&quot;    &#61;&gt; 1
  &quot;economix&quot; &#61;&gt; 2
  &quot;curv&quot;     &#61;&gt; 21
  &quot;skylight&quot; &#61;&gt; 4
  &quot;unoffici&quot; &#61;&gt; 5
  &quot;touchpad&quot; &#61;&gt; 1
  &quot;bidder&quot;   &#61;&gt; 4
  &quot;whiz&quot;     &#61;&gt; 3
  &quot;beckett&quot;  &#61;&gt; 5
  &quot;brandt&quot;   &#61;&gt; 5
  &quot;apiec&quot;    &#61;&gt; 4
  &quot;il&quot;       &#61;&gt; 3
  &quot;msnbc&quot;    &#61;&gt; 3
  &quot;archiv&quot;   &#61;&gt; 25
  &quot;overdos&quot;  &#61;&gt; 2
  &quot;ankl&quot;     &#61;&gt; 26
  ⋮          &#61;&gt; ⋮
</pre>

If we wish to have a reverse lookup for each word with row index for the document/s in which it appears, we need to create an inverse index. Fortunately, TextAnalysis makes this easy for us.

<pre class='hljl'>
<span class='hljl-nf'>update_inverse_index!</span><span class='hljl-p'>(</span><span class='hljl-n'>crps</span><span class='hljl-p'>)</span>
</pre>

<pre class='hljl'>
<span class='hljl-nf'>inverse_index</span><span class='hljl-p'>(</span><span class='hljl-n'>crps</span><span class='hljl-p'>)</span>
</pre>

<pre class="output">
Dict&#123;String,Array&#123;Int64,1&#125;&#125; with 22718 entries:
  &quot;nuhu&quot;     &#61;&gt; &#91;603&#93;
  &quot;ironwe&quot;   &#61;&gt; &#91;630&#93;
  &quot;wintri&quot;   &#61;&gt; &#91;159, 583&#93;
  &quot;flatb&quot;    &#61;&gt; &#91;744&#93;
  &quot;economix&quot; &#61;&gt; &#91;611, 809&#93;
  &quot;curv&quot;     &#61;&gt; &#91;23, 47, 51, 272, 284, 422, 493, 522, 559, 575, 584, 599, 6
13, …
  &quot;skylight&quot; &#61;&gt; &#91;360, 376, 530, 634&#93;
  &quot;unoffici&quot; &#61;&gt; &#91;24, 123, 281, 719, 999&#93;
  &quot;touchpad&quot; &#61;&gt; &#91;757&#93;
  &quot;bidder&quot;   &#61;&gt; &#91;104, 235, 881&#93;
  &quot;whiz&quot;     &#61;&gt; &#91;51, 321, 857&#93;
  &quot;beckett&quot;  &#61;&gt; &#91;397, 601, 701, 750, 992&#93;
  &quot;brandt&quot;   &#61;&gt; &#91;91, 493, 706, 800, 916&#93;
  &quot;apiec&quot;    &#61;&gt; &#91;328, 773, 816, 869&#93;
  &quot;il&quot;       &#61;&gt; &#91;234, 833, 939&#93;
  &quot;msnbc&quot;    &#61;&gt; &#91;89, 107, 746&#93;
  &quot;archiv&quot;   &#61;&gt; &#91;203, 243, 245, 368, 549, 560, 599, 676, 716, 826, 833, 878
, 88…
  &quot;overdos&quot;  &#61;&gt; &#91;639, 758&#93;
  &quot;ankl&quot;     &#61;&gt; &#91;147, 158, 168, 241, 266, 375, 393, 408, 447, 462, 572, 662
, 72…
  ⋮          &#61;&gt; ⋮
</pre>

<pre class='hljl'>
<span class='hljl-n'>m</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>DocumentTermMatrix</span><span class='hljl-p'>(</span><span class='hljl-n'>crps</span><span class='hljl-p'>);</span>
</pre>

The DocumentTermMatrix is a struct with properties containing the components necessary to create a term frequency inverse document frequency &#40;tfidf&#41; matrix for the corpus. This will be applied in later procedures involving information retrieval or sentiment analysis.

The document term matrix is stored in a data structure called <a href="https://docs.julialang.org/en/v1/stdlib/SparseArrays/index.html">SparseMatrixCSC</a>. Sparse matrices are distinct from dense matrices in that the only values stores are non-zero values. In julia, zero values can be stored but only manually. Sparse matrices are common in machine learning, such as in data that contains counts and data encodings that map values to n dimensional arrays, because these computationally efficient data structures can elicit performance gains when used by algorithms meant to take advantage of sparsity.

The inverse index also provides us with a count of the number of documents each word appears in. This is known as document frequencies.

To obtain the tfidf matrix we will simply use the function below applied to the document term matrix.

<pre class='hljl'>
<span class='hljl-n'>tfidf</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>tf_idf</span><span class='hljl-p'>(</span><span class='hljl-n'>m</span><span class='hljl-p'>);</span>
</pre>

### Steps for computing tfidf

What if we want to do all of the above manually?

<ol>
<li><p>Create the bag of words &#40;bow&#41;, a set of words unique over the corpus. A set is a good datatype for this since it doesn&#39;t allow duplicates. At the end you&#39;ll want to convert it to a list so that we can deal with our words in a consistent order.</p>
</li>
</ol>

<pre class='hljl'>
<span class='hljl-n'>cleaned_docs</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-p'>[]</span><span class='hljl-t'>
</span><span class='hljl-n'>bow</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>Set</span><span class='hljl-p'>{</span><span class='hljl-n'>String</span><span class='hljl-p'>}();</span><span class='hljl-t'>
</span><span class='hljl-k'>for</span><span class='hljl-t'> </span><span class='hljl-n'>doc</span><span class='hljl-t'> </span><span class='hljl-kp'>in</span><span class='hljl-t'> </span><span class='hljl-n'>fds</span><span class='hljl-t'>
    </span><span class='hljl-n'>cleaned</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>tokenize</span><span class='hljl-p'>(</span><span class='hljl-nf'>my_prepare</span><span class='hljl-p'>((</span><span class='hljl-nf'>text</span><span class='hljl-p'>(</span><span class='hljl-n'>doc</span><span class='hljl-p'>))))</span><span class='hljl-t'>
    </span><span class='hljl-nf'>union!</span><span class='hljl-p'>(</span><span class='hljl-n'>bow</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-nf'>Set</span><span class='hljl-p'>(</span><span class='hljl-n'>cleaned</span><span class='hljl-p'>))</span><span class='hljl-t'>
    </span><span class='hljl-nf'>push!</span><span class='hljl-p'>(</span><span class='hljl-n'>cleaned_docs</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>cleaned</span><span class='hljl-p'>)</span><span class='hljl-t'>
</span><span class='hljl-k'>end</span><span class='hljl-t'>
</span><span class='hljl-nf'>filter!</span><span class='hljl-p'>(</span><span class='hljl-oB'>!</span><span class='hljl-n'>isempty</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>cleaned_docs</span><span class='hljl-p'>);</span>
</pre>

<ol start="2">
<li><p>Create a reverse lookup for the vocab list. This is a dictionary whose keys are the words and values are the indices of the words &#40;the word id&#41;. This will make things much faster than using the list index function.</p>
</li>
</ol>

<pre class='hljl'>
<span class='hljl-n'>indexer</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>Dict</span><span class='hljl-p'>{</span><span class='hljl-n'>String</span><span class='hljl-p'>,</span><span class='hljl-n'>Int64</span><span class='hljl-p'>}()</span><span class='hljl-t'>
</span><span class='hljl-k'>for</span><span class='hljl-t'> </span><span class='hljl-p'>(</span><span class='hljl-n'>i</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>word</span><span class='hljl-p'>)</span><span class='hljl-t'> </span><span class='hljl-kp'>in</span><span class='hljl-t'> </span><span class='hljl-nf'>enumerate</span><span class='hljl-p'>(</span><span class='hljl-n'>bow</span><span class='hljl-p'>)</span><span class='hljl-t'>
    </span><span class='hljl-n'>indexer</span><span class='hljl-p'>[</span><span class='hljl-n'>word</span><span class='hljl-p'>]</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-n'>i</span><span class='hljl-t'>
</span><span class='hljl-k'>end</span>
</pre>

<ol start="3">
<li><p>Create a word count matrix. This is an array data type where each row corresponds to a document and each column a word. The value should be the count of the number of times that word appeared in that document.</p>
</li>
</ol>

<pre class='hljl'>
<span class='hljl-n'>num_docs</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>length</span><span class='hljl-p'>(</span><span class='hljl-n'>fds</span><span class='hljl-p'>)</span><span class='hljl-t'>
</span><span class='hljl-n'>num_words</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>length</span><span class='hljl-p'>(</span><span class='hljl-n'>indexer</span><span class='hljl-p'>);</span>
</pre>

<pre class='hljl'>
<span class='hljl-n'>counts</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>zeros</span><span class='hljl-p'>((</span><span class='hljl-n'>num_docs</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>num_words</span><span class='hljl-p'>));</span>
</pre>

<pre class='hljl'>
<span class='hljl-k'>for</span><span class='hljl-t'> </span><span class='hljl-p'>(</span><span class='hljl-n'>idx</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>doc</span><span class='hljl-p'>)</span><span class='hljl-t'> </span><span class='hljl-kp'>in</span><span class='hljl-t'> </span><span class='hljl-nf'>enumerate</span><span class='hljl-p'>(</span><span class='hljl-n'>cleaned_docs</span><span class='hljl-p'>)</span><span class='hljl-t'>
    </span><span class='hljl-n'>C</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>Dict</span><span class='hljl-p'>{</span><span class='hljl-n'>String</span><span class='hljl-p'>,</span><span class='hljl-n'>Int64</span><span class='hljl-p'>}()</span><span class='hljl-t'>
    </span><span class='hljl-k'>for</span><span class='hljl-t'> </span><span class='hljl-n'>word</span><span class='hljl-t'> </span><span class='hljl-kp'>in</span><span class='hljl-t'> </span><span class='hljl-n'>doc</span><span class='hljl-t'>
        </span><span class='hljl-n'>C</span><span class='hljl-p'>[</span><span class='hljl-n'>word</span><span class='hljl-p'>]</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>get</span><span class='hljl-p'>(</span><span class='hljl-n'>C</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>word</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-ni'>0</span><span class='hljl-p'>)</span><span class='hljl-t'> </span><span class='hljl-oB'>+</span><span class='hljl-t'> </span><span class='hljl-ni'>1</span><span class='hljl-t'>
    </span><span class='hljl-k'>end</span><span class='hljl-t'>
    </span><span class='hljl-k'>for</span><span class='hljl-t'> </span><span class='hljl-p'>(</span><span class='hljl-n'>word</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>count</span><span class='hljl-p'>)</span><span class='hljl-t'> </span><span class='hljl-kp'>in</span><span class='hljl-t'> </span><span class='hljl-n'>C</span><span class='hljl-t'>
        </span><span class='hljl-n'>counts</span><span class='hljl-p'>[</span><span class='hljl-n'>idx</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>indexer</span><span class='hljl-p'>[</span><span class='hljl-n'>word</span><span class='hljl-p'>]]</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-n'>count</span><span class='hljl-t'>
    </span><span class='hljl-k'>end</span><span class='hljl-t'>
</span><span class='hljl-k'>end</span>
</pre>

<ol start="4">
<li><p>Create the document frequencies. For each word, get a count of the number of documents the word appears in. This is different from the total number of times the word appears.</p>
</li>
</ol>

<pre class='hljl'>
<span class='hljl-n'>df</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>sum</span><span class='hljl-p'>(</span><span class='hljl-n'>counts</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>dims</span><span class='hljl-oB'>=</span><span class='hljl-ni'>1</span><span class='hljl-p'>);</span>
</pre>

<ol start="5">
<li><p>Normalize the word count matrix to get the term frequencies. This means dividing each term frequency by the l2 &#40;euclidean&#41; norm. This makes each document vector has a length of 1.</p>
</li>
</ol>

<pre class='hljl'>
<span class='hljl-cs'># document_frequencies</span><span class='hljl-t'>
</span><span class='hljl-n'>tf_norm</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-n'>sqrt</span><span class='hljl-oB'>.</span><span class='hljl-p'>(</span><span class='hljl-nf'>sum</span><span class='hljl-p'>(</span><span class='hljl-n'>counts</span><span class='hljl-t'> </span><span class='hljl-oB'>.^</span><span class='hljl-t'> </span><span class='hljl-ni'>2</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>dims</span><span class='hljl-oB'>=</span><span class='hljl-ni'>2</span><span class='hljl-p'>));</span><span class='hljl-t'>
</span><span class='hljl-n'>tf_norm</span><span class='hljl-p'>[</span><span class='hljl-n'>tf_norm</span><span class='hljl-t'> </span><span class='hljl-oB'>.==</span><span class='hljl-t'> </span><span class='hljl-ni'>0</span><span class='hljl-p'>]</span><span class='hljl-t'> </span><span class='hljl-oB'>.=</span><span class='hljl-t'> </span><span class='hljl-ni'>1</span><span class='hljl-p'>;</span><span class='hljl-t'>
</span><span class='hljl-n'>tfs</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-n'>counts</span><span class='hljl-t'> </span><span class='hljl-oB'>./</span><span class='hljl-t'> </span><span class='hljl-n'>tf_norm</span><span class='hljl-p'>;</span>
</pre>



<ol start="6">
<li><p>Multiply the term frequency matrix by the log of the inverse of the document frequencies to get the tf-idf matrix. We add one to the denominator to avoid dividing by 0.</p>
</li>
</ol>

<pre class='hljl'>
<span class='hljl-n'>idf</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-n'>log</span><span class='hljl-oB'>.</span><span class='hljl-p'>((</span><span class='hljl-n'>num_docs</span><span class='hljl-t'> </span><span class='hljl-oB'>+</span><span class='hljl-t'> </span><span class='hljl-ni'>1</span><span class='hljl-p'>)</span><span class='hljl-t'> </span><span class='hljl-oB'>./</span><span class='hljl-t'> </span><span class='hljl-p'>(</span><span class='hljl-ni'>1</span><span class='hljl-t'> </span><span class='hljl-oB'>.+</span><span class='hljl-t'> </span><span class='hljl-n'>df</span><span class='hljl-p'>))</span><span class='hljl-t'> </span><span class='hljl-oB'>.+</span><span class='hljl-t'> </span><span class='hljl-ni'>1</span><span class='hljl-p'>;</span><span class='hljl-t'>
</span><span class='hljl-n'>tfidf_m</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-n'>tfs</span><span class='hljl-t'> </span><span class='hljl-oB'>.*</span><span class='hljl-t'> </span><span class='hljl-n'>idf</span><span class='hljl-p'>;</span>
</pre>

<ol start="7">
<li><p>Normalize the tf-idf matrix as well by dividing by the l2 norm.</p>
</li>
</ol>

<pre class='hljl'>
<span class='hljl-n'>tfidf_norm</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-n'>sqrt</span><span class='hljl-oB'>.</span><span class='hljl-p'>(</span><span class='hljl-nf'>sum</span><span class='hljl-p'>(</span><span class='hljl-n'>tfidf_m</span><span class='hljl-t'> </span><span class='hljl-oB'>.^</span><span class='hljl-t'> </span><span class='hljl-ni'>2</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>dims</span><span class='hljl-oB'>=</span><span class='hljl-ni'>2</span><span class='hljl-p'>));</span><span class='hljl-t'>
</span><span class='hljl-n'>tfidf_norm</span><span class='hljl-p'>[</span><span class='hljl-n'>tfidf_norm</span><span class='hljl-t'> </span><span class='hljl-oB'>.==</span><span class='hljl-t'> </span><span class='hljl-ni'>0</span><span class='hljl-p'>]</span><span class='hljl-t'> </span><span class='hljl-oB'>.=</span><span class='hljl-t'> </span><span class='hljl-ni'>1</span><span class='hljl-p'>;</span><span class='hljl-t'>
</span><span class='hljl-n'>tfidf_m</span><span class='hljl-t'> </span><span class='hljl-oB'>./=</span><span class='hljl-t'> </span><span class='hljl-n'>tfidf_norm</span><span class='hljl-p'>;</span>
</pre>

### Cosine Similarity Using TFIDF

The tfidf approach is common for understanding relative term importances in a document. It is a classic way to encode documents so that arbitrary queries, different forms of clustering and document classification tasks can now be executed. We have a vector space model as the representation of a set of documents. Queries can now be viewed in the same space as the document collection in order to allow for information retrieval.

One way to do scoring of the distance between vectors is by similarity score. Cosine similarity quantifies how much two multidimensional vectors point in the same direction on a scale from 1 &#40;pointing in the same direction&#41; to -1 &#40;pointing in opposite directions&#41;. A cosine similarity of 0 means that the vectors are orthogonal. I use the <a href="https://github.com/JuliaStats/Distances.jl">Distances.jl</a> library to calculate this.

<pre class='hljl'>
<span class='hljl-k'>using</span><span class='hljl-t'> </span><span class='hljl-n'>Distances</span>
</pre>

<pre class='hljl'>
<span class='hljl-s'>&quot;&quot;&quot;
readlines_remove_leading_whitespace(doc)

Returns an array of strings without leading whitespace lines
&quot;&quot;&quot;</span><span class='hljl-t'>
</span><span class='hljl-k'>function</span><span class='hljl-t'> </span><span class='hljl-nf'>my_readlines</span><span class='hljl-p'>(</span><span class='hljl-n'>doc_title</span><span class='hljl-p'>)</span><span class='hljl-t'>
    </span><span class='hljl-n'>lines</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>readlines</span><span class='hljl-p'>(</span><span class='hljl-n'>doc_title</span><span class='hljl-p'>)</span><span class='hljl-t'>
    </span><span class='hljl-n'>i</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-ni'>1</span><span class='hljl-t'>
    </span><span class='hljl-k'>while</span><span class='hljl-t'> </span><span class='hljl-kc'>true</span><span class='hljl-t'>
        </span><span class='hljl-k'>if</span><span class='hljl-t'> </span><span class='hljl-nf'>length</span><span class='hljl-p'>(</span><span class='hljl-nf'>strip</span><span class='hljl-p'>(</span><span class='hljl-n'>lines</span><span class='hljl-p'>[</span><span class='hljl-n'>i</span><span class='hljl-p'>]))</span><span class='hljl-t'> </span><span class='hljl-oB'>!==</span><span class='hljl-t'> </span><span class='hljl-ni'>0</span><span class='hljl-t'>
            </span><span class='hljl-k'>break</span><span class='hljl-t'>
        </span><span class='hljl-k'>end</span><span class='hljl-t'>
        </span><span class='hljl-n'>i</span><span class='hljl-t'> </span><span class='hljl-oB'>+=</span><span class='hljl-t'> </span><span class='hljl-ni'>1</span><span class='hljl-t'>
    </span><span class='hljl-k'>end</span><span class='hljl-t'>
    </span><span class='hljl-k'>return</span><span class='hljl-t'> </span><span class='hljl-n'>lines</span><span class='hljl-p'>[</span><span class='hljl-n'>i</span><span class='hljl-oB'>:</span><span class='hljl-nf'>lastindex</span><span class='hljl-p'>(</span><span class='hljl-n'>lines</span><span class='hljl-p'>)]</span><span class='hljl-t'>
</span><span class='hljl-k'>end</span><span class='hljl-t'>


</span><span class='hljl-n'>ix_A</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-ni'>1</span><span class='hljl-p'>;</span><span class='hljl-t'> </span><span class='hljl-n'>doc_A</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-n'>tfidf</span><span class='hljl-p'>[</span><span class='hljl-n'>ix_A</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-oB'>:</span><span class='hljl-p'>]</span><span class='hljl-t'>
</span><span class='hljl-n'>ix_B</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-ni'>589</span><span class='hljl-t'> </span><span class='hljl-p'>;</span><span class='hljl-t'> </span><span class='hljl-n'>doc_B</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-n'>tfidf</span><span class='hljl-p'>[</span><span class='hljl-n'>ix_B</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-oB'>:</span><span class='hljl-p'>]</span><span class='hljl-t'>
</span><span class='hljl-nf'>println</span><span class='hljl-p'>(</span><span class='hljl-s'>&quot;</span><span class='hljl-se'>\n</span><span class='hljl-s'>document A: &quot;</span><span class='hljl-p'>)</span>
</pre>

<pre class="output">
document A:
</pre>

<pre class='hljl'>
<span class='hljl-n'>println</span><span class='hljl-oB'>.</span><span class='hljl-p'>(</span><span class='hljl-nf'>my_readlines</span><span class='hljl-p'>(</span><span class='hljl-n'>crps</span><span class='hljl-p'>[</span><span class='hljl-n'>ix_A</span><span class='hljl-p'>]</span><span class='hljl-oB'>.</span><span class='hljl-n'>metadata</span><span class='hljl-oB'>.</span><span class='hljl-n'>title</span><span class='hljl-p'>)[</span><span class='hljl-ni'>1</span><span class='hljl-oB'>:</span><span class='hljl-ni'>5</span><span class='hljl-p'>])</span><span class='hljl-t'> </span><span class='hljl-cs'># print just 5 lines</span>
</pre>

<pre class="output">
Hey, the man on the phone said. Are you still coming tonight?


It took a moment for me to realize that he was calling from Distilled to co
nfirm my dinner reservation.
Yes, I replied. Cool, he said, and sounded as if he meant it.
</pre>

<pre class='hljl'>
<span class='hljl-nf'>println</span><span class='hljl-p'>(</span><span class='hljl-s'>&quot;</span><span class='hljl-se'>\n</span><span class='hljl-s'>document B: &quot;</span><span class='hljl-p'>)</span>
</pre>

<pre class="output">
document B:
</pre>

<pre class='hljl'>
<span class='hljl-n'>println</span><span class='hljl-oB'>.</span><span class='hljl-p'>(</span><span class='hljl-nf'>my_readlines</span><span class='hljl-p'>(</span><span class='hljl-n'>crps</span><span class='hljl-p'>[</span><span class='hljl-n'>ix_B</span><span class='hljl-p'>]</span><span class='hljl-oB'>.</span><span class='hljl-n'>metadata</span><span class='hljl-oB'>.</span><span class='hljl-n'>title</span><span class='hljl-p'>)[</span><span class='hljl-ni'>1</span><span class='hljl-oB'>:</span><span class='hljl-ni'>5</span><span class='hljl-p'>])</span><span class='hljl-t'> </span><span class='hljl-cs'># print just 5 lines</span>
</pre>

<pre class="output">
The last time we tasted mencas from Bierzo, Spain, my recipe included rosem
ary, the wines dominant herbal note. Consistency may be someone elses hobgo
blin, but its nice to see it in wines; there was that rosemary again.

Pairings often welcome contrasts, but this time I picked up the flavors and
 aromas of the wine and tossed them into the pan. Green peppers, a hit of c
hile, olives and a beefy smoke. All have been incorporated in this dish.
</pre>

<pre class='hljl'>
<span class='hljl-nf'>println</span><span class='hljl-p'>(</span><span class='hljl-s'>&quot;</span><span class='hljl-se'>\n</span><span class='hljl-s'>Cosine Similarity of documents A &amp; B: &quot;</span><span class='hljl-p'>)</span>
</pre>

<pre class="output">
Cosine Similarity of documents A &amp; B:
</pre>

<pre class='hljl'>
<span class='hljl-ni'>1</span><span class='hljl-t'> </span><span class='hljl-oB'>-</span><span class='hljl-t'> </span><span class='hljl-nf'>evaluate</span><span class='hljl-p'>(</span><span class='hljl-nf'>CosineDist</span><span class='hljl-p'>(),</span><span class='hljl-t'> </span><span class='hljl-n'>doc_A</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>doc_B</span><span class='hljl-p'>)</span>
</pre>

<pre class="output">
0.028020811811042434
</pre>

If we want to compute the pairwise distance between all documents simultaneously, we can do that using the pairwise function from Distances.jl.

<pre class='hljl'>
<span class='hljl-n'>r</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>zeros</span><span class='hljl-p'>((</span><span class='hljl-n'>num_docs</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>num_docs</span><span class='hljl-p'>));</span><span class='hljl-t'>
</span><span class='hljl-nd'>@time</span><span class='hljl-t'> </span><span class='hljl-nf'>pairwise!</span><span class='hljl-p'>(</span><span class='hljl-n'>r</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-nf'>CosineDist</span><span class='hljl-p'>(),</span><span class='hljl-t'> </span><span class='hljl-nf'>transpose</span><span class='hljl-p'>(</span><span class='hljl-n'>tfidf</span><span class='hljl-p'>),</span><span class='hljl-t'> </span><span class='hljl-n'>dims</span><span class='hljl-oB'>=</span><span class='hljl-ni'>2</span><span class='hljl-p'>);</span>
</pre>

<pre class="output">
27.148998 seconds &#40;2.52 M allocations: 110.984 MiB, 0.49&#37; gc time&#41;
</pre>

<pre class='hljl'>
<span class='hljl-nf'>println</span><span class='hljl-p'>(</span><span class='hljl-s'>&quot;Similarity measure pairwise: &quot;</span><span class='hljl-p'>)</span>
</pre>

<pre class="output">
Similarity measure pairwise:
</pre>

<pre class='hljl'>
<span class='hljl-ni'>1</span><span class='hljl-t'> </span><span class='hljl-oB'>.-</span><span class='hljl-t'> </span><span class='hljl-n'>r</span>
</pre>

<pre class="output">
999×999 Array&#123;Float64,2&#125;:
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
 ⋮                                   ⋱
 0.0110392   0.00678634  0.00443852  …  0.0317835   0.0223228   0.0220557
 0.0185624   0.0143821   0.014936       0.0112221   0.0321573   0.0177684
 0.00954421  0.00613039  0.0112613      0.0266921   0.00133801  0.0369548
 0.0151518   0.00557817  0.0166722      0.0127879   0.00899566  0.0288063
 0.00818376  0.00588771  0.0102004      0.0153659   0.0416719   0.0120247
 0.00384303  0.00421517  0.00990962  …  0.0150054   0.00692421  0.0363021
 0.00754566  0.0189835   0.018636       1.0         0.0309683   0.0790843
 0.0156072   0.0316948   0.0193947      0.0309683   1.0         0.0392533
 0.00758319  0.0200642   0.0231317      0.0790843   0.0392533   1.0
</pre>

### Feature Importances: Applications of TFIDF

Given a corpus of documents, related to each other or not, we can use the tfidf score to rank words in order of importance to the text. We can also just use the word frequencies by passing in the term frequency sparse matrix instead.

<pre class='hljl'>
<span class='hljl-s'>&quot;&quot;&quot;
Returns top n tfidf values in row and return them with their corresponding feature names
&quot;&quot;&quot;</span><span class='hljl-t'>
</span><span class='hljl-k'>function</span><span class='hljl-t'> </span><span class='hljl-nf'>get_top_tfidf_feats</span><span class='hljl-p'>(</span><span class='hljl-n'>row</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>features</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>top_n</span><span class='hljl-oB'>::</span><span class='hljl-n'>Int64</span><span class='hljl-oB'>=</span><span class='hljl-ni'>10</span><span class='hljl-p'>)</span><span class='hljl-t'>
    </span><span class='hljl-k'>if</span><span class='hljl-t'> </span><span class='hljl-nf'>length</span><span class='hljl-p'>(</span><span class='hljl-n'>row</span><span class='hljl-p'>)</span><span class='hljl-t'> </span><span class='hljl-oB'>&gt;</span><span class='hljl-t'> </span><span class='hljl-n'>top_n</span><span class='hljl-t'>
        </span><span class='hljl-n'>top_idxs</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>sortperm</span><span class='hljl-p'>(</span><span class='hljl-n'>row</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>rev</span><span class='hljl-oB'>=</span><span class='hljl-kc'>true</span><span class='hljl-p'>)[</span><span class='hljl-ni'>1</span><span class='hljl-oB'>:</span><span class='hljl-n'>top_n</span><span class='hljl-p'>]</span><span class='hljl-t'>
    </span><span class='hljl-k'>else</span><span class='hljl-t'>
        </span><span class='hljl-n'>top_idxs</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>sortperm</span><span class='hljl-p'>(</span><span class='hljl-n'>row</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>rev</span><span class='hljl-oB'>=</span><span class='hljl-kc'>true</span><span class='hljl-p'>)</span><span class='hljl-t'>
    </span><span class='hljl-k'>end</span><span class='hljl-t'>
    </span><span class='hljl-k'>return</span><span class='hljl-t'> </span><span class='hljl-p'>[(</span><span class='hljl-n'>features</span><span class='hljl-p'>[</span><span class='hljl-n'>i</span><span class='hljl-p'>],</span><span class='hljl-t'> </span><span class='hljl-n'>row</span><span class='hljl-p'>[</span><span class='hljl-n'>i</span><span class='hljl-p'>])</span><span class='hljl-t'> </span><span class='hljl-k'>for</span><span class='hljl-t'> </span><span class='hljl-n'>i</span><span class='hljl-t'> </span><span class='hljl-kp'>in</span><span class='hljl-t'> </span><span class='hljl-n'>top_idxs</span><span class='hljl-p'>]</span><span class='hljl-t'>
</span><span class='hljl-k'>end</span>
</pre>

<pre class="output">
get_top_tfidf_feats
</pre>

<pre class='hljl'>
<span class='hljl-s'>&quot;&quot;&quot;
Returns top tfidf features in specific document (matrix row)
&quot;&quot;&quot;</span><span class='hljl-t'>
</span><span class='hljl-k'>function</span><span class='hljl-t'> </span><span class='hljl-nf'>get_top_feats_in_doc</span><span class='hljl-p'>(</span><span class='hljl-n'>X_sparse</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>features</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>row_id</span><span class='hljl-oB'>::</span><span class='hljl-n'>Int64</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>top_n</span><span class='hljl-oB'>::</span><span class='hljl-n'>Int64</span><span class='hljl-oB'>=</span><span class='hljl-ni'>10</span><span class='hljl-p'>)</span><span class='hljl-t'>
    </span><span class='hljl-nf'>get_top_tfidf_feats</span><span class='hljl-p'>(</span><span class='hljl-n'>X_sparse</span><span class='hljl-p'>[</span><span class='hljl-n'>row_id</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-oB'>:</span><span class='hljl-p'>],</span><span class='hljl-t'> </span><span class='hljl-n'>features</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>top_n</span><span class='hljl-p'>)</span><span class='hljl-t'>
</span><span class='hljl-k'>end</span>
</pre>

<pre class="output">
get_top_feats_in_doc
</pre>

<pre class='hljl'>
<span class='hljl-n'>feature_array</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>collect</span><span class='hljl-p'>(</span><span class='hljl-nf'>keys</span><span class='hljl-p'>(</span><span class='hljl-n'>crps</span><span class='hljl-oB'>.</span><span class='hljl-n'>lexicon</span><span class='hljl-p'>));</span>
</pre>

<pre class='hljl'>
<span class='hljl-cs'># top 10 words for document 23</span><span class='hljl-t'>
</span><span class='hljl-nf'>get_top_feats_in_doc</span><span class='hljl-p'>(</span><span class='hljl-n'>tfidf</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>feature_array</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-ni'>23</span><span class='hljl-p'>)</span>
</pre>

<pre class="output">
10-element Array&#123;Tuple&#123;String,Float64&#125;,1&#125;:
 &#40;&quot;carr&quot;, 0.0837980511755615&#41;
 &#40;&quot;wayward&quot;, 0.067933919942415&#41;
 &#40;&quot;paperback&quot;, 0.055194433110973204&#41;
 &#40;&quot;laboratorio&quot;, 0.05197697721460046&#41;
 &#40;&quot;rein&quot;, 0.051330724026278404&#41;
 &#40;&quot;strength&quot;, 0.04892547199630457&#41;
 &#40;&quot;longitudin&quot;, 0.04666726201789564&#41;
 &#40;&quot;make&quot;, 0.04400478467419274&#41;
 &#40;&quot;wrink&quot;, 0.04198383512222033&#41;
 &#40;&quot;pari&quot;, 0.03963874160568814&#41;
</pre>

<pre class='hljl'>
<span class='hljl-k'>using</span><span class='hljl-t'> </span><span class='hljl-n'>StatsBase</span><span class='hljl-t'> </span><span class='hljl-cs'># import StatsBase to use the mean function</span><span class='hljl-t'>

</span><span class='hljl-s'>&quot;&quot;&quot;
Returns the top n features that on average are most important amongst documents in rows
indentified by indices in grp_ids
&quot;&quot;&quot;</span><span class='hljl-t'>
</span><span class='hljl-k'>function</span><span class='hljl-t'> </span><span class='hljl-nf'>get_top_mean_feats</span><span class='hljl-p'>(</span><span class='hljl-n'>X_sparse</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>features</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>grp_ids</span><span class='hljl-oB'>=</span><span class='hljl-n'>nothing</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>top_n</span><span class='hljl-oB'>::</span><span class='hljl-n'>Int64</span><span class='hljl-oB'>=</span><span class='hljl-ni'>10</span><span class='hljl-p'>)</span><span class='hljl-t'>
    </span><span class='hljl-k'>if</span><span class='hljl-t'> </span><span class='hljl-nf'>isnothing</span><span class='hljl-p'>(</span><span class='hljl-n'>grp_ids</span><span class='hljl-p'>)</span><span class='hljl-t'>
        </span><span class='hljl-n'>D</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-n'>X_sparse</span><span class='hljl-t'>
    </span><span class='hljl-k'>else</span><span class='hljl-t'>
        </span><span class='hljl-n'>D</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-n'>X_sparse</span><span class='hljl-p'>[</span><span class='hljl-n'>grp_ids</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-oB'>:</span><span class='hljl-p'>]</span><span class='hljl-t'>
    </span><span class='hljl-k'>end</span><span class='hljl-t'>
    </span><span class='hljl-n'>tfidf_means</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>vec</span><span class='hljl-p'>(</span><span class='hljl-nf'>mean</span><span class='hljl-p'>(</span><span class='hljl-n'>D</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>dims</span><span class='hljl-oB'>=</span><span class='hljl-ni'>1</span><span class='hljl-p'>))</span><span class='hljl-t'>
    </span><span class='hljl-k'>return</span><span class='hljl-t'> </span><span class='hljl-nf'>get_top_tfidf_feats</span><span class='hljl-p'>(</span><span class='hljl-n'>tfidf_means</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>features</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>top_n</span><span class='hljl-p'>)</span><span class='hljl-t'>
</span><span class='hljl-k'>end</span>
</pre>

<pre class="output">
get_top_mean_feats
</pre>

<pre class='hljl'>
<span class='hljl-nf'>get_top_mean_feats</span><span class='hljl-p'>(</span><span class='hljl-n'>tfidf</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>feature_array</span><span class='hljl-p'>)</span>
</pre>

<pre class="output">
10-element Array&#123;Tuple&#123;String,Float64&#125;,1&#125;:
 &#40;&quot;unfulfil&quot;, 0.004298837611037763&#41;
 &#40;&quot;earthflight&quot;, 0.003694854911730176&#41;
 &#40;&quot;paperback&quot;, 0.0036727650633894353&#41;
 &#40;&quot;rebound&quot;, 0.0035198602372548795&#41;
 &#40;&quot;lama&quot;, 0.003464234955213334&#41;
 &#40;&quot;uneas&quot;, 0.003222486091908161&#41;
 &#40;&quot;scholar&quot;, 0.0031950129131286284&#41;
 &#40;&quot;schonberg&quot;, 0.003039835421215477&#41;
 &#40;&quot;zz&quot;, 0.003027595424161008&#41;
 &#40;&quot;dire&quot;, 0.0029909884549977864&#41;
</pre>

### Using JuliaDB with Labeled Data

So far we’ve only considered words as individual units, and considered their relationships to the larger corpus of documents. Many interesting features can be found by performing text analyses based on the relationships between words and examining which words tend to follow others immediately, or that tend to co-occur within the same documents.

Lets say we want to confirm our hypothesis that documents from different New York Times news sections have different combinations of words. I use JuliaDB to load data from <em>section_names.csv</em> and combine this data with our texts. I then create different corpora used for finding top bigram features.

<pre class='hljl'>
<span class='hljl-k'>using</span><span class='hljl-t'> </span><span class='hljl-n'>JuliaDB</span>
</pre>

<pre class='hljl'>
<span class='hljl-n'>col_names</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-p'>[</span><span class='hljl-s'>&quot;id&quot;</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-s'>&quot;section&quot;</span><span class='hljl-p'>]</span><span class='hljl-t'>
</span><span class='hljl-n'>sections_table</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>loadtable</span><span class='hljl-p'>(</span><span class='hljl-s'>&quot;data/section_names.csv&quot;</span><span class='hljl-p'>;</span><span class='hljl-t'> </span><span class='hljl-n'>header_exists</span><span class='hljl-oB'>=</span><span class='hljl-kc'>false</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>colnames</span><span class='hljl-oB'>=</span><span class='hljl-n'>col_names</span><span class='hljl-p'>);</span><span class='hljl-t'>
</span><span class='hljl-cs'># reindex has inplace function</span><span class='hljl-t'>
</span><span class='hljl-n'>sections_table</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>reindex</span><span class='hljl-p'>(</span><span class='hljl-n'>sections_table</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-sc'>:id</span><span class='hljl-p'>);</span>
</pre>

<pre class='hljl'>
<span class='hljl-cs'># create a mask for just the text in the book section</span><span class='hljl-t'>
</span><span class='hljl-n'>msk_books</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>select</span><span class='hljl-p'>(</span><span class='hljl-n'>sections_table</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-sc'>:section</span><span class='hljl-t'> </span><span class='hljl-oB'>=&gt;</span><span class='hljl-t'> </span><span class='hljl-n'>x</span><span class='hljl-t'> </span><span class='hljl-oB'>-&gt;</span><span class='hljl-t'> </span><span class='hljl-n'>x</span><span class='hljl-t'> </span><span class='hljl-oB'>==</span><span class='hljl-t'> </span><span class='hljl-s'>&quot;Books&quot;</span><span class='hljl-t'> </span><span class='hljl-p'>);</span>
</pre>

<pre class='hljl'>
<span class='hljl-n'>bi_grams</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-n'>NGramDocument</span><span class='hljl-oB'>.</span><span class='hljl-p'>(</span><span class='hljl-n'>text</span><span class='hljl-oB'>.</span><span class='hljl-p'>(</span><span class='hljl-n'>crps</span><span class='hljl-p'>),</span><span class='hljl-t'> </span><span class='hljl-ni'>2</span><span class='hljl-p'>);</span>
</pre>

<pre class='hljl'>
<span class='hljl-n'>bi_gram_crps</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>Corpus</span><span class='hljl-p'>(</span><span class='hljl-n'>bi_grams</span><span class='hljl-p'>)</span><span class='hljl-t'>
</span><span class='hljl-nf'>update_lexicon!</span><span class='hljl-p'>(</span><span class='hljl-n'>bi_gram_crps</span><span class='hljl-p'>)</span><span class='hljl-t'> </span><span class='hljl-cs'># update our bigram lexicon</span>
</pre>

<pre class='hljl'>
<span class='hljl-n'>tfidf2</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>tf_idf</span><span class='hljl-p'>(</span><span class='hljl-nf'>DocumentTermMatrix</span><span class='hljl-p'>(</span><span class='hljl-n'>bi_gram_crps</span><span class='hljl-p'>));</span><span class='hljl-t'>
</span><span class='hljl-n'>feature_array2</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>collect</span><span class='hljl-p'>(</span><span class='hljl-nf'>keys</span><span class='hljl-p'>(</span><span class='hljl-n'>bi_gram_crps</span><span class='hljl-oB'>.</span><span class='hljl-n'>lexicon</span><span class='hljl-p'>));</span>
</pre>

<pre class='hljl'>
<span class='hljl-cs'># &quot;10 most important words by mean tfidf score in Books sections: &quot;</span><span class='hljl-t'>
</span><span class='hljl-nf'>get_top_mean_feats</span><span class='hljl-p'>(</span><span class='hljl-n'>tfidf2</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>feature_array2</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-nf'>findall</span><span class='hljl-p'>(</span><span class='hljl-oB'>!!</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>msk_books</span><span class='hljl-p'>),</span><span class='hljl-t'> </span><span class='hljl-ni'>20</span><span class='hljl-p'>)</span>
</pre>

<pre class="output">
20-element Array&#123;Tuple&#123;String,Float64&#125;,1&#125;:
 &#40;&quot;approv keyston&quot;, 0.012769003009089008&#41;
 &#40;&quot;dan mccabe&quot;, 0.009084626784167946&#41;
 &#40;&quot;nw washington&quot;, 0.008826231299062898&#41;
 &#40;&quot;lemon garnish&quot;, 0.006859985948229485&#41;
 &#40;&quot;colleg game&quot;, 0.006457915014267387&#41;
 &#40;&quot;book regain&quot;, 0.005745935812141618&#41;
 &#40;&quot;list rentbro&quot;, 0.005745935812141618&#41;
 &#40;&quot;ban agenc&quot;, 0.005617242437875209&#41;
 &#40;&quot;honey&quot;, 0.004994429413701268&#41;
 &#40;&quot;historian name&quot;, 0.004977841281908868&#41;
 &#40;&quot;art park&quot;, 0.004830438541265002&#41;
 &#40;&quot;greav&quot;, 0.004380921925796904&#41;
 &#40;&quot;miss proposit&quot;, 0.004340074866415672&#41;
 &#40;&quot;justin bieber&quot;, 0.004302304441744708&#41;
 &#40;&quot;jasper tex&quot;, 0.004211579209546832&#41;
 &#40;&quot;attend colleg&quot;, 0.004065387616803975&#41;
 &#40;&quot;prison serv&quot;, 0.00390747355666676&#41;
 &#40;&quot;wipe entir&quot;, 0.003862566285592531&#41;
 &#40;&quot;design elicit&quot;, 0.0037377902666676363&#41;
 &#40;&quot;wife peopl&quot;, 0.003494950648622221&#41;
</pre>

<pre class='hljl'>
<span class='hljl-n'>msk_sports</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>select</span><span class='hljl-p'>(</span><span class='hljl-n'>sections_table</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-sc'>:section</span><span class='hljl-t'> </span><span class='hljl-oB'>=&gt;</span><span class='hljl-t'> </span><span class='hljl-n'>x</span><span class='hljl-t'> </span><span class='hljl-oB'>-&gt;</span><span class='hljl-t'> </span><span class='hljl-n'>x</span><span class='hljl-t'> </span><span class='hljl-oB'>==</span><span class='hljl-t'> </span><span class='hljl-s'>&quot;Sports&quot;</span><span class='hljl-t'> </span><span class='hljl-p'>);</span>
</pre>

<pre class='hljl'>
<span class='hljl-cs'># &quot;10 most important words by mean tfidf score in Sports sections: &quot;</span><span class='hljl-t'>
</span><span class='hljl-nf'>get_top_mean_feats</span><span class='hljl-p'>(</span><span class='hljl-n'>tfidf2</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>feature_array2</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-nf'>findall</span><span class='hljl-p'>(</span><span class='hljl-oB'>!!</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>msk_sports</span><span class='hljl-p'>),</span><span class='hljl-t'> </span><span class='hljl-ni'>20</span><span class='hljl-p'>)</span><span class='hljl-t'> </span><span class='hljl-cs'># !! is a double negator</span>
</pre>

<pre class="output">
20-element Array&#123;Tuple&#123;String,Float64&#125;,1&#125;:
 &#40;&quot;economist depart&quot;, 0.011148866380634209&#41;
 &#40;&quot;tablespoon chinkiang&quot;, 0.008779464262457137&#41;
 &#40;&quot;concert half&quot;, 0.008471186667189075&#41;
 &#40;&quot;lead downtown&quot;, 0.007550361586371777&#41;
 &#40;&quot;suppos braini&quot;, 0.006811770657058267&#41;
 &#40;&quot;hop guest&quot;, 0.006192600712560494&#41;
 &#40;&quot;judg ive&quot;, 0.005836589364014666&#41;
 &#40;&quot;afghan relat&quot;, 0.005685508385988465&#41;
 &#40;&quot;bootsi collin&quot;, 0.005682484391653045&#41;
 &#40;&quot;scene depriv&quot;, 0.00536856407437897&#41;
 &#40;&quot;five card&quot;, 0.005312194038379561&#41;
 &#40;&quot;plan improv&quot;, 0.004952347354472934&#41;
 &#40;&quot;accolad&quot;, 0.00478566813792554&#41;
 &#40;&quot;wine vegan&quot;, 0.004778521884857718&#41;
 &#40;&quot;receiv call&quot;, 0.004675518934544374&#41;
 &#40;&quot;watch liriano&quot;, 0.004577184649360663&#41;
 &#40;&quot;support republ&quot;, 0.0045527193515291125&#41;
 &#40;&quot;mystic invent&quot;, 0.004533042470476335&#41;
 &#40;&quot;seddiqi disput&quot;, 0.004482410268596228&#41;
 &#40;&quot;bronx identifi&quot;, 0.0041501025347195665&#41;
</pre>

### Ranking Document Relevance using Cosine Similarity

<pre class='hljl'>
<span class='hljl-n'>queries_text</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>readlines</span><span class='hljl-p'>(</span><span class='hljl-s'>&quot;queries.txt&quot;</span><span class='hljl-p'>);</span>
</pre>

<pre class='hljl'>
<span class='hljl-n'>q_crps</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>Corpus</span><span class='hljl-p'>(</span><span class='hljl-n'>StringDocument</span><span class='hljl-oB'>.</span><span class='hljl-p'>(</span><span class='hljl-n'>my_prepare</span><span class='hljl-oB'>.</span><span class='hljl-p'>(</span><span class='hljl-n'>queries_text</span><span class='hljl-p'>)));</span><span class='hljl-t'>
</span><span class='hljl-n'>q_tfidf</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>tf_idf</span><span class='hljl-p'>(</span><span class='hljl-nf'>dtm</span><span class='hljl-p'>(</span><span class='hljl-nf'>DocumentTermMatrix</span><span class='hljl-p'>(</span><span class='hljl-n'>q_crps</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>crps</span><span class='hljl-oB'>.</span><span class='hljl-n'>lexicon</span><span class='hljl-p'>)));</span>
</pre>

<pre class='hljl'>
<span class='hljl-k'>function</span><span class='hljl-t'> </span><span class='hljl-nf'>print_result</span><span class='hljl-p'>(</span><span class='hljl-n'>crps</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>row_id</span><span class='hljl-oB'>::</span><span class='hljl-n'>Int64</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>num_lines</span><span class='hljl-oB'>::</span><span class='hljl-n'>Int64</span><span class='hljl-oB'>=</span><span class='hljl-ni'>5</span><span class='hljl-p'>)</span><span class='hljl-t'>
    </span><span class='hljl-nf'>println</span><span class='hljl-p'>(</span><span class='hljl-s'>&quot;</span><span class='hljl-se'>\n</span><span class='hljl-s'>&quot;</span><span class='hljl-p'>)</span><span class='hljl-t'>
    </span><span class='hljl-n'>println</span><span class='hljl-oB'>.</span><span class='hljl-p'>(</span><span class='hljl-nf'>my_readlines</span><span class='hljl-p'>(</span><span class='hljl-n'>crps</span><span class='hljl-p'>[</span><span class='hljl-n'>row_id</span><span class='hljl-p'>]</span><span class='hljl-oB'>.</span><span class='hljl-n'>metadata</span><span class='hljl-oB'>.</span><span class='hljl-n'>title</span><span class='hljl-p'>)[</span><span class='hljl-ni'>1</span><span class='hljl-oB'>:</span><span class='hljl-n'>num_lines</span><span class='hljl-p'>])</span><span class='hljl-t'>
    </span><span class='hljl-nf'>println</span><span class='hljl-p'>(</span><span class='hljl-s'>&quot;...</span><span class='hljl-se'>\n</span><span class='hljl-s'>&quot;</span><span class='hljl-p'>)</span><span class='hljl-t'>
    </span><span class='hljl-k'>return</span><span class='hljl-t'>
</span><span class='hljl-k'>end</span>
</pre>

<pre class="output">
print_result &#40;generic function with 2 methods&#41;
</pre>

<pre class='hljl'>
<span class='hljl-k'>function</span><span class='hljl-t'> </span><span class='hljl-nf'>get_similar_documents</span><span class='hljl-p'>(</span><span class='hljl-n'>x</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>top_n</span><span class='hljl-oB'>::</span><span class='hljl-n'>Int64</span><span class='hljl-oB'>=</span><span class='hljl-ni'>3</span><span class='hljl-p'>)</span><span class='hljl-t'>
    </span><span class='hljl-n'>arr</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-p'>[]</span><span class='hljl-t'>
    </span><span class='hljl-k'>for</span><span class='hljl-t'> </span><span class='hljl-n'>i</span><span class='hljl-t'> </span><span class='hljl-kp'>in</span><span class='hljl-t'> </span><span class='hljl-ni'>1</span><span class='hljl-oB'>:</span><span class='hljl-n'>tfidf</span><span class='hljl-oB'>.</span><span class='hljl-n'>m</span><span class='hljl-t'>
        </span><span class='hljl-n'>relevance</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-ni'>1</span><span class='hljl-t'> </span><span class='hljl-oB'>-</span><span class='hljl-t'> </span><span class='hljl-nf'>evaluate</span><span class='hljl-p'>(</span><span class='hljl-nf'>CosineDist</span><span class='hljl-p'>(),</span><span class='hljl-t'> </span><span class='hljl-n'>tfidf</span><span class='hljl-p'>[</span><span class='hljl-n'>i</span><span class='hljl-p'>,</span><span class='hljl-oB'>:</span><span class='hljl-p'>],</span><span class='hljl-t'> </span><span class='hljl-n'>x</span><span class='hljl-p'>)</span><span class='hljl-t'>
        </span><span class='hljl-nf'>push!</span><span class='hljl-p'>(</span><span class='hljl-n'>arr</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>relevance</span><span class='hljl-p'>)</span><span class='hljl-t'>
    </span><span class='hljl-k'>end</span><span class='hljl-t'>

    </span><span class='hljl-nf'>filter!</span><span class='hljl-p'>(</span><span class='hljl-oB'>!</span><span class='hljl-n'>isnan</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>arr</span><span class='hljl-p'>);</span><span class='hljl-t'>
    </span><span class='hljl-n'>l</span><span class='hljl-t'> </span><span class='hljl-oB'>=</span><span class='hljl-t'> </span><span class='hljl-nf'>lastindex</span><span class='hljl-p'>(</span><span class='hljl-nf'>sortperm</span><span class='hljl-p'>(</span><span class='hljl-n'>arr</span><span class='hljl-p'>))</span><span class='hljl-t'>
    </span><span class='hljl-nf'>print</span><span class='hljl-p'>(</span><span class='hljl-s'>&quot;</span><span class='hljl-se'>\n</span><span class='hljl-s'>search results:</span><span class='hljl-se'>\n</span><span class='hljl-s'> &quot;</span><span class='hljl-p'>)</span><span class='hljl-t'>
    </span><span class='hljl-p'>[</span><span class='hljl-nf'>print_result</span><span class='hljl-p'>(</span><span class='hljl-n'>crps</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-nf'>sortperm</span><span class='hljl-p'>(</span><span class='hljl-n'>arr</span><span class='hljl-p'>)[</span><span class='hljl-n'>i</span><span class='hljl-p'>])</span><span class='hljl-t'> </span><span class='hljl-k'>for</span><span class='hljl-t'> </span><span class='hljl-n'>i</span><span class='hljl-t'> </span><span class='hljl-kp'>in</span><span class='hljl-t'> </span><span class='hljl-n'>l</span><span class='hljl-t'> </span><span class='hljl-oB'>-</span><span class='hljl-t'> </span><span class='hljl-n'>top_n</span><span class='hljl-oB'>:</span><span class='hljl-n'>l</span><span class='hljl-p'>];</span><span class='hljl-t'>
</span><span class='hljl-k'>end</span>
</pre>

<pre class="output">
get_similar_documents &#40;generic function with 2 methods&#41;
</pre>

<pre class='hljl'>
<span class='hljl-k'>function</span><span class='hljl-t'> </span><span class='hljl-nf'>search</span><span class='hljl-p'>(</span><span class='hljl-n'>query_idx</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-n'>top_n</span><span class='hljl-oB'>::</span><span class='hljl-n'>Int64</span><span class='hljl-oB'>=</span><span class='hljl-ni'>3</span><span class='hljl-p'>)</span><span class='hljl-t'>
    </span><span class='hljl-nf'>print</span><span class='hljl-p'>(</span><span class='hljl-s'>&quot;</span><span class='hljl-se'>\n</span><span class='hljl-s'>query</span><span class='hljl-se'>\n</span><span class='hljl-s'>: &quot;</span><span class='hljl-p'>)</span><span class='hljl-t'>
    </span><span class='hljl-nf'>print</span><span class='hljl-p'>(</span><span class='hljl-n'>queries_text</span><span class='hljl-p'>[</span><span class='hljl-n'>query_idx</span><span class='hljl-p'>])</span><span class='hljl-t'>
    </span><span class='hljl-nf'>get_similar_documents</span><span class='hljl-p'>(</span><span class='hljl-n'>q_tfidf</span><span class='hljl-p'>[</span><span class='hljl-n'>query_idx</span><span class='hljl-p'>,</span><span class='hljl-t'> </span><span class='hljl-oB'>:</span><span class='hljl-p'>],</span><span class='hljl-t'> </span><span class='hljl-n'>top_n</span><span class='hljl-p'>)</span><span class='hljl-t'>
    </span><span class='hljl-k'>return</span><span class='hljl-t'>
</span><span class='hljl-k'>end</span>
</pre>

<pre class="output">
search &#40;generic function with 2 methods&#41;
</pre>

<pre class='hljl'>
<span class='hljl-nf'>search</span><span class='hljl-p'>(</span><span class='hljl-ni'>7</span><span class='hljl-p'>)</span>
</pre>

<pre class="output">
query
: Watching the Game of Thrones contingent take their final &#40;and somewhat co
mplicated&#41; bow this weekend at Comic-Con International I found myself wonde
ring: Will we ever see the likes of the HBO hit series again? Fans will con
tinue to debate the creative choices made in the finale season but the over
all accomplishment of David Benioff &amp; D.B. Weiss and their writing staff wa
s truly staggering. They not only delivered the most stirring fantasy epic
since Peter Jackson’s The Lord of The Rings they did it on a weekly basis a
nd with nuances that made the sword-and-sorcery show a must-see favorite ev
en among non-fantasy fans.
search results:


AMC wants more Dead and who could be surprised?
The Walking Dead, the top show in television among the advertiser-preferred
 group of viewers between the ages of 18 and 49 is going to get what AMC is
 calling a companion series, with an expected airdate sometime in 2015.

The network announced on Monday that Robert Kirkman, who wrote the comic bo
ok series that inspired the television show, will develop the new version,
which is still untitled. It will, fans will be happy to note, feature zombi
es.
In a statement, Mr. Kirkman said, The opportunity to make a show that isnt
tethered by the events of the comic book, and is truly a blank page, has se
t my creativity racing.
Other members of the Walking Dead creative team, including the producers Ga
le Anne Hurd and David Alpert, will be involved in the new effort as well.

...



When the Mets moved into Citi Field five years ago, they were also, as it t
urned out, settling into fourth place in the National League East and makin
g themselves comfortable. If their season ended Friday, they would finish i
n that very undistinguished spot for the fifth straight season. It would be
 a franchise record, dubious as it might seem, for never in their uphill hi
story have they ended up staying in the same place for so long.


Even in the 1960s, when the Mets made a name for themselves as one of the w
orst teams in baseball history, they finished 10th, and last, only in their
 first four years of existence. In the fifth year, 1966, they finished next
 to last, in ninth.
In baseballs current division format, fourth is the new ninth, a home for t
eams that are usually overmatched and not going anywhere in particular. Tha
t certainly describes the current Mets, who have now been in fourth place l
ong enough to buy a new recliner, hang up some pictures and get to know the
 neighbors &#40;hello, Miami Marlins&#41;.
...



FLORHAM PARK, N.J.  When Rex Ryan was hired to coach the Jets in 2009, he i
nsisted on running effectively, a philosophy that he captured in the catchp
hrase ground and pound. Even as the Jets develop Geno Smith, a rookie quart
erback who understandably lacks polish, that is no longer Ryans mantra.



Do I expect us to run more than pass? Not really, Ryan said after Thursdays
 practice. Id like to be close to balanced. I think thats where weve been t
he first couple of games. So I think thats pretty good.
The Jets, who will host the Buffalo Bills on Sunday in a meeting of A.F.C.
East teams with 1-1 records, have attempted 74 passes and 61 rushes. Smith
dropped back 42 times in a 13-10 loss at the New England Patriots on Sept.
12 in a game that raised questions about how committed Marty Mornhinweg, th
e new offensive coordinator, would be to the run. The Jets backed off the g
round game despite rushing 32 times for 129 yards; Smith threw three interc
eptions in the fourth quarter.
...



                            Several times in Rush, Ron Howards excitingly t
orqued movie set in the Formula One race world, the camera gets so close to
 a drivers eye that you can see each trembling lash. Its a startlingly beau
tiful but also naked image, partly because theres no hiding for an actor wh
en the camera gets that close. In moments like these, youre no longer watch
ing a performance with its layers of art and technique: youve crossed the b
order between fiction and documentary to go eye to eye with another persons
 nervous system. Mr. Howard doesnt just want you to crawl inside a Formula
One racecar, he also wants you to crawl inside its drivers head.


                            Specifically, he wants to get inside those of J
ames Hunt &#40;Chris Hemsworth&#41; and Niki Lauda &#40;Daniel Brhl&#41;, Formula One titan
s and rivals, who, in 1976, helped push the sport into mainstream conscious
ness. &#40;Well, at least in much of the rest of the world: Formula One has lon
g struggled in the United States.&#41; In 1976, when both men were in their lat
e 20s, they raced after each other while chasing the world championship ove
r wet, dry and terrifyingly gnarly tracks. Tucked, very much alone, into op
en-wheel machines that could easily have become coffins, Hunt and Lauda cut
 corners and grazed death lap after lap  whooshing over racetracks, city st
reets and deceptively pastoral roads into the sort of sports legend that tr
anslates only occasionally into good cinema.

...
</pre>

### Wrapping Up

This tutorial showed a text analysis approach that is useful for exploring the relationships and connections between words. Relationships involving n-grams, which help to see what words tend to appear after others, or co-occurences can help us find which terms are most important to a document. It is my aim to convey that Julia, as a tool for text analysis, is just as flexible as Python and that it will play an important role in the work data scientists do moving forward.
