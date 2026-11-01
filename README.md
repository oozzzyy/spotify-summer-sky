# Spotify Summer Sky

A reworked version of the [Summer Sky](https://github.com/Adrien5902/SpicetifyCat/tree/main/themes/Summer_Sky) theme from [SpicetifyCat](https://github.com/Adrien5902/SpicetifyCat) by Adrien5902, for [Spicetify](https://spicetify.app). It was not built from scratch: the original theme was rebuilt into a navy, see-through look. A progress bar that moves like living water comes with it.

[Русская версия](README.ru.md)

![Illustration: the wave progress bar](docs/wave-bar.svg)

**Before:** the original Summer Sky by Adrien5902.

![Before: the original Summer Sky theme on the Liked Songs page](https://github.com/Adrien5902/SpicetifyCat/blob/main/themes/Summer_Sky/preview.png?raw=true)

**After:** this version on the same page, darker and more see-through.

![After: this version on the Liked Songs page](docs/after.png)

*The blue heart cover is a personal image and is not part of the theme. After installing, you will see the original cover from Adrien5902.*

Each part works without the other.

## Install

You need Spicetify. Run these in PowerShell from the repository folder.

### Theme

```powershell
Copy-Item .\SummerSky "$env:APPDATA\spicetify\Themes\SummerSky" -Recurse
spicetify config current_theme SummerSky color_scheme Summer_Sky
spicetify config inject_css 1 replace_colors 1 inject_theme_js 1
spicetify apply
```

### Wave bar

```powershell
Copy-Item .\extensions\blue-wave-bar.js "$env:APPDATA\spicetify\Extensions"
spicetify config extensions blue-wave-bar.js
spicetify apply
```

The bar reacts to the track's loudness and calms down on pause. Seeking works as usual.

## Credits

The theme is a modified version of [Summer Sky](https://github.com/Adrien5902/SpicetifyCat/tree/main/themes/Summer_Sky) from [SpicetifyCat](https://github.com/Adrien5902/SpicetifyCat) by Adrien5902, under the MIT license. The original is the starting point, so go there for the theme as its author made it. The background and "Liked Songs" images are not stored here: `theme.js` loads them from the original repository. All rights to them stay with their authors, and the background art is signed by Aeuna.

Spotify updates can rename the interface classes this theme relies on, so parts of it may stop working after an update.

## License

[MIT](LICENSE)
