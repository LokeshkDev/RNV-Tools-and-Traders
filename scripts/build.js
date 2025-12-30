const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

// Helper for recursive readdir
function getFiles(dir, allFiles = []) {
    if (!fs.existsSync(dir)) return allFiles;
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const name = path.join(dir, f);
        if (fs.statSync(name).isDirectory()) {
            if (!['node_modules', '.git', 'css', 'js', 'lib', 'img', 'scss', 'src', 'scripts', 'assets'].includes(f)) {
                getFiles(name, allFiles);
            }
        } else {
            if (f.endsWith('.html')) {
                allFiles.push(name);
            }
        }
    }
    return allFiles;
}

const jsFiles = [
    'lib/easing/easing.min.js',
    'lib/waypoints/waypoints.min.js',
    'lib/owlcarousel/owl.carousel.min.js',
    'lib/tempusdominus/js/moment.min.js',
    'lib/tempusdominus/js/moment-timezone.min.js',
    'lib/tempusdominus/js/tempusdominus-bootstrap-4.min.js',
    'lib/isotope/isotope.pkgd.min.js',
    'lib/lightbox/js/lightbox.min.js',
    'js/main.js'
];

async function runBuild() {
    try {
        console.log('Building CSS Bundle...');
        await esbuild.build({
            entryPoints: ['src/bundle.css'],
            bundle: true,
            minify: true,
            outfile: 'css/min.css',
            loader: {
                '.png': 'file',
                '.jpg': 'file',
                '.jpeg': 'file',
                '.svg': 'file',
                '.woff': 'file',
                '.woff2': 'file',
                '.ttf': 'file',
                '.eot': 'file',
                '.ico': 'file',
                '.gif': 'file',
            },
            assetNames: 'assets/[name]-[hash]',
        });

        console.log('Building JS Bundle...');
        // We concatenate manually and mask CommonJS globals to prevent UMD errors in browser
        const jsMask = 'var define = undefined; var module = undefined; var exports = undefined;';
        const jsContent = [
            jsMask,
            ...jsFiles.map(f => {
                console.log(`Adding ${f}...`);
                return fs.readFileSync(f, 'utf8');
            })
        ].join('\n;\n');

        const jsResult = await esbuild.transform(jsContent, {
            minify: true,
            loader: 'js',
        });
        fs.writeFileSync('js/min.js', jsResult.code);

        console.log('Updating HTML files...');
        const htmlFiles = getFiles('.');
        // Also include root html files
        const rootHtml = fs.readdirSync('.').filter(f => f.endsWith('.html')).map(f => f);
        const allHtml = [...new Set([...htmlFiles, ...rootHtml])];

        for (const htmlFile of allHtml) {
            let content = fs.readFileSync(htmlFile, 'utf8');

            // Calculate depth correctly
            // Normalize path to use forward slashes for depth calculation
            const normalizedPath = htmlFile.replace(/\\/g, '/');
            const depth = normalizedPath.split('/').length - 1;
            const prefix = depth > 0 ? '../'.repeat(depth) : '';

            console.log(`Processing ${htmlFile} (depth: ${depth}, prefix: ${prefix})...`);

            // CSS replacement: Match from Libraries Stylesheet start to Style Stylesheet end
            const cssRegex = /<!-- Libraries Stylesheet -->[\s\S]*?<link href="[^"]*?style\.css" rel="stylesheet">/i;
            const newCssTag = `<!-- Combined Stylesheet -->\n    <link href="${prefix}css/min.css" rel="stylesheet">`;

            if (cssRegex.test(content)) {
                content = content.replace(cssRegex, newCssTag);
            } else {
                console.warn(`Could not find CSS markers in ${htmlFile}`);
            }

            // JS replacement: Match from easing.min.js to main.js
            const jsRegex = /<script src="[^"]*?lib\/easing\/easing\.min\.js"><\/script>[\s\S]*?<script src="[^"]*?js\/main\.js"><\/script>/i;
            const newJsTag = `<script src="${prefix}js/min.js"></script>`;

            if (jsRegex.test(content)) {
                content = content.replace(jsRegex, newJsTag);
            } else {
                console.warn(`Could not find JS markers in ${htmlFile}`);
            }

            fs.writeFileSync(htmlFile, content);
        }

        console.log('Build complete successfully!');
    } catch (err) {
        if (err.errors) {
            err.errors.forEach(e => console.error(`Error: ${e.text} at ${e.location?.file}:${e.location?.line}`));
        } else {
            console.error('Build failed:', err);
        }
        process.exit(1);
    }
}

runBuild();
