# Replacing the scene art

The game works without image files: `styles.css` draws a temporary pixel-style landscape and traveler with CSS. Put your own images in this folder when they are ready.

At the top of `styles.css`, replace any of these `none` values with a URL:

```css
--background-far: url("assets/far-sky.png");
--background-middle: url("assets/trees.png");
--background-near: url("assets/foreground.png");
--traveler-sprite: url("assets/traveler.png");
```

The three layers move at different speeds when the expedition advances. Use transparent PNG or WebP images with seamless horizontal edges for the middle and near layers. The far layer can be a wide sky or mountain image. Pixel images are shown with `image-rendering: pixelated`.

To use your own traveler sprite, set `--traveler-sprite` as above and add `has-sprite` to the traveler's class in `index.html`. The `has-sprite` class hides the CSS placeholder traveler.

To add a pixel font, put the licensed font file here, declare it with `@font-face` in `styles.css`, and change `--font-pixel` at the top of that file.
