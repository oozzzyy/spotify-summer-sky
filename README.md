# Spotify Summer Sky

A navy [Spicetify](https://spicetify.app) theme with a see-through interface, plus a progress bar that moves like living water.

[Русская версия](README.ru.md)

![Illustration: the wave progress bar](docs/wave-bar.svg)

![Preview of the original Summer Sky theme](https://github.com/Adrien5902/SpicetifyCat/blob/main/themes/Summer_Sky/preview.png?raw=true)

*Preview of the original Summer Sky sub-theme by Adrien5902. This version is darker and more see-through.*

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

The theme is a modified version of [SpicetifyCat](https://github.com/Adrien5902/SpicetifyCat) by Adrien5902, under the MIT license. The background and "Liked Songs" images are not stored here: `theme.js` loads them from the original repository. All rights to them stay with their authors, and the background art is signed by Aeuna.

Spotify updates can rename the interface classes this theme relies on, so parts of it may stop working after an update.

## License

[MIT](LICENSE)
