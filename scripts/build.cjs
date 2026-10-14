const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

async function build() {
    const root = path.join(__dirname, '..');
    const assets = path.join(root, 'assets');
    fs.mkdirSync(path.join(assets, 'webfonts'), { recursive: true });
    const copy = (source, destination) => fs.copyFileSync(path.join(root, source), path.join(assets, destination));
    copy('node_modules/chart.js/dist/chart.umd.js', 'chart.umd.js');
    copy('node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', 'inter-latin-wght-normal.woff2');
    const iconStyles = ['fontawesome', 'solid', 'regular'].map(name =>
        fs.readFileSync(path.join(root, `node_modules/@fortawesome/fontawesome-free/css/${name}.min.css`), 'utf8')
            .replaceAll('../webfonts/', './webfonts/')).join('\n');
    fs.writeFileSync(path.join(assets, 'icons.css'), iconStyles);
    for (const name of ['fa-solid-900', 'fa-regular-400']) {
        for (const extension of ['woff2', 'ttf']) copy(`node_modules/@fortawesome/fontawesome-free/webfonts/${name}.${extension}`, `webfonts/${name}.${extension}`);
    }
    copy('node_modules/chart.js/LICENSE.md', 'chart-LICENSE.md');
    copy('node_modules/@fortawesome/fontawesome-free/LICENSE.txt', 'fontawesome-LICENSE.txt');
    copy('node_modules/@fontsource-variable/inter/LICENSE', 'inter-LICENSE.txt');
    for (const size of [192, 512]) await sharp(path.join(root, 'icon.svg')).resize(size, size).png().toFile(path.join(assets, `icon-${size}.png`));
    const output = path.join(root, 'dist');
    fs.rmSync(output, { recursive: true, force: true });
    fs.mkdirSync(output, { recursive: true });
    for (const name of ['index.html', 'sleep-tracker.html', 'manifest.webmanifest', 'pwa.js', 'sw.js', 'sitemap.xml', 'assets']) {
        fs.cpSync(path.join(root, name), path.join(output, name), { recursive: true });
    }
    for (const name of fs.readdirSync(root).filter(name => /^google[a-zA-Z0-9_-]+\.html$/.test(name))) {
        fs.copyFileSync(path.join(root, name), path.join(output, name));
    }
    console.log('Built local assets and GitHub Pages site in dist/.');
}

build().catch(error => { console.error(error); process.exitCode = 1; });