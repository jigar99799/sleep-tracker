const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const output = path.join(root, 'release');
const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'sleep-log-release-'));
const filename = 'sleep-habit-log-web.zip';

try {
    fs.mkdirSync(output, { recursive: true });
    for (const name of ['index.html', 'sleep-tracker.html', 'manifest.webmanifest', 'pwa.js', 'sw.js', 'sitemap.xml', 'assets']) {
        fs.cpSync(path.join(root, 'dist', name), path.join(staging, name), { recursive: true });
    }
    fs.copyFileSync(path.join(root, 'README.md'), path.join(staging, 'README.md'));
    fs.copyFileSync(path.join(root, 'CONTRIBUTING.md'), path.join(staging, 'CONTRIBUTING.md'));
    const archive = path.join(output, filename);
    fs.rmSync(archive, { force: true });
    execFileSync('zip', ['-q', '-r', archive, '.'], { cwd: staging, stdio: 'inherit' });
    const checksum = crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
    fs.writeFileSync(path.join(output, 'SHA256SUMS.txt'), `${checksum}  ${filename}\n`);
    console.log(`Created release/${filename} and release/SHA256SUMS.txt (web package, not an APK).`);
} finally {
    fs.rmSync(staging, { recursive: true, force: true });
}