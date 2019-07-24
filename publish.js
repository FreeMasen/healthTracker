const child = require('child_process');
const fs = require('fs');
const path = require('path');
async function main() {
    let ng = path.join(__dirname, 'node_modules', '.bin', 'ng');
    let wp = path.join(__dirname, 'node_modules', '.bin', 'webpack');
    if (process.platform.startsWith('win')) {
        ng += '.cmd';
        wp += '.cmd';
    }
    await runProcess('ng', `${ng} build --prod --output-path docs --base-href /healthTracker/`);
    await runProcess('webpack', wp);
    await copyFile('docs/index.html', 'docs/404.html');
}

async function runProcess(name, cmd) {
    return new Promise((r, j) => {
        child.exec(cmd, (e, out, err) => {
            if (e) return j(`${e}\nstdout:${out}\nstderr:${err}`);
            console.log(`${name}: ${out}`);
            return r();
        });
    });
}

async function copyFile(from, to) {
    if (fs.promises) {
        return fs.promises.copyFile(from, to);
    } else {
        return new Promise((r, j) => {
            fs.copyFile(from, to, e => {
                if (e) return j(e);
                return r();
            });
        });
    }
}



main().then(() => console.log('success')).catch(e => console.error('error in main', e));