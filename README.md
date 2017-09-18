# sentjs
Simple plaintext presentation tool.  Ported from [sent](https://tools.suckless.org/sent/).

## Why?

* PPTX sucks
* LATEX sucks
* PDF sucks
* X sucks

## Usage:
Create an HTML file containing your presentation slides where each slide is separated by a blank line:
```html
<meta charset="utf-8">
<script src="https://unpkg.com/sentjs">
First slide

Second slide

# a comment

# image slide
@ImageUrl

# blank slide
\

# a slide that contains an ending script tag:
<\/script>

# a slide that starts with a special char
\@this will be a slide and not an image
\# this will be a comment and not an image

# \<space> for a blank line within a slide
First line
\ 
Second line

# utf-8 supported (or other charset by setting meta)
😀😁😂😃😄😅😆😇😈😉😊😋😌😍😎😏
😐😑😒😓😔😕😖😗😘😙😚😛😜😝😞😟
😠😡😢😣😥😦😧😨😩😪😫😭😮😯😰😱
😲😳😴😵😶😷😸😹😺😻😼😽😾😿🙀☠

# Multiple blanks line are ignored


# must have closing script tag
</script>
```

Then view the file in your browser.  Use arrow keys to navigate.  F11 for fullscreen.


