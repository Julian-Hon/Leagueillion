# Replacing the scene art

The game uses three matching backgrounds: `city-day.png` for the landing screen and first question, `city-dusk.png` for question two, and `city-night.png` for question three. They crossfade during the journey between questions. To replace them, put three images with the same framing in this folder and change the variables near the top of `styles.css`. The original CSS landscape remains as a fallback; remove `use-art` from the scene in `index.html` to show it.

At the top of `styles.css`, set the image URLs:

```css
--background-day: url("assets/your-day-background.png");
--background-dusk: url("assets/your-dusk-background.png");
--background-night: url("assets/your-night-background.png");
--background-far: url("assets/far-sky.png");
--background-middle: url("assets/trees.png");
--background-near: url("assets/foreground.png");
```

The main backgrounds pan slightly as the expedition advances. The optional three extra layers move at different speeds. Use transparent PNG or WebP images with seamless horizontal edges for the middle and near layers. The far layer can be a wide sky or mountain image. Pixel images are shown with `image-rendering: pixelated`.

To add a pixel font, put the licensed font file here, declare it with `@font-face` in `styles.css`, and change `--font-pixel` at the top of that file.
