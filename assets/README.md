# Replacing the scene art

The current main background is `sunlit-pixel-woodland.png`. To replace it, put your image in this folder and change `--background-main` near the top of `styles.css`. The original CSS landscape is kept as a fallback; remove `use-art` from the scene in `index.html` to show it.

At the top of `styles.css`, replace any of these `none` values with a URL:

```css
--background-main: url("assets/your-background.png");
--background-far: url("assets/far-sky.png");
--background-middle: url("assets/trees.png");
--background-near: url("assets/foreground.png");
--traveler-sprite: url("assets/traveler.png");
```

The main background pans slightly as the expedition advances. The optional three extra layers move at different speeds. Use transparent PNG or WebP images with seamless horizontal edges for the middle and near layers. The far layer can be a wide sky or mountain image. Pixel images are shown with `image-rendering: pixelated`.

To use your own traveler sprite, set `--traveler-sprite` as above and add `has-sprite` to the traveler's class in `index.html`. The `has-sprite` class hides the CSS placeholder traveler.

To add a pixel font, put the licensed font file here, declare it with `@font-face` in `styles.css`, and change `--font-pixel` at the top of that file.
