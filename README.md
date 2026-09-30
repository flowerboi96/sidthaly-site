# sidthaly.com

Portfolio site for Sid Thaly, fantasy book cover and character illustrator.
Plain HTML, CSS and a little JavaScript. No framework and no build step, so it
runs anywhere and is easy to edit with Claude Code.

## Folder layout

```
index.html          the home page (work, commissions, about, quote form)
shop.html           the shop: prints, stickers, bookmarks, postcards, oracle deck
css/style.css       all styles; colours and fonts are set at the top
js/main.js          phone menu, cover carousel and filters, full-size viewer, quote form
fonts/              self-hosted Anton and Archivo (open licence)
images/
  bg/               grainy nebula backgrounds (hero, "Beyond the cover", quote form)
  logo/             Sid Thaly logo with the red ink stroke (white and black versions)
  covers/           book covers, 2:3 portrait
  characters/       character sheets and character art
  cards/            card art
  game/             game art (SURI etc.)
  sid-portrait.jpg  About photo, 4:5
  og-image.jpg      picture shown when the link is shared (1200 × 630)
favicon.svg         browser tab icon
```

The images in `images/` are placeholders. Each one has its recommended export
size printed in the bottom-right corner.

## Replacing and adding artwork

1. Export from your painting app as JPG (quality about 85) or WebP.
   Long edge 1600 to 2400 px, ideally 300 to 600 KB per image.
   Keep full-resolution originals off the website.
2. Put the file in the right folder, using lowercase names with hyphens,
   for example `images/covers/ember-queen.jpg`.
3. In `index.html`, copy an existing `<li class="slide">` block in the carousel and change:
   - `data-category`: `covers`, `characters`, `cards` or `game`
   - `data-title` and `data-meta`: the name and small line shown under the carousel
   - `src`: the image path
   - `alt`: one line describing the picture (helps search engines and screen readers)
   - `width` and `height`: the image's real pixel size
   Keep book covers first. The page opens on the fourth piece.
4. The "Beyond the cover" collage uses the oracle card, character sheet and
   trading card images; change their paths in that section.

Or ask Claude Code: "Add images/covers/ember-queen.jpg as a book cover called
Ember Queen, romantasy, 6 × 9 in."

## The shop (shop.html)

- Each product is one `<li class="product">` block: change the image, name,
  size line and price there. The prices in the file are samples to replace.
- "Order" opens an email to hello@sidthaly.com with the item filled in.
  To take payment online, replace that link's `href` with a Razorpay or
  Instamojo payment link for the product.
- Don't sell merch of client work (for example SURI art); use your own pieces.

## Commissions

The Commissions section of `index.html` shows no prices on purpose: each
commission is quoted to the brief. Prices appear only in the shop.

## Turning on the quote form

1. Create a free account at formspree.io and add a new form.
2. Copy the form ID (the part after `/f/` in the endpoint URL).
3. In `index.html`, replace `YOUR_FORM_ID` in the form's `action` with it.
Briefs then arrive in your inbox. The free plan allows 50 a month.

## Previewing on your computer

Open `index.html` in a browser. Or run `python3 -m http.server` in this folder
and visit http://localhost:8000.

## Publishing (Cloudflare Pages)

1. Push this folder to a GitHub repository.
2. In Cloudflare: Workers & Pages → Create → Pages → Connect to Git → choose the repo.
   Framework preset: None. Build command: leave empty. Output directory: `/`.
3. After the first deploy: Custom domains → add `sidthaly.com` (and `www.sidthaly.com`).
4. From then on, every push to the `main` branch goes live in about a minute.

## Editing checklist

- Commission options and what they include: the Commissions section of `index.html`
- Shop products and prices: `shop.html`
- Social links: the About section
- Colours: the `:root` block at the top of `css/style.css`
