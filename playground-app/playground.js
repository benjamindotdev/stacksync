const http = require('http');
const fs = require('fs');
const path = require('path');
const { techMap } = require('stacksync/dist/techMap');
const simpleIconsHex = require('stacksync/dist/simple-icons-hex');
const { batchImport } = require('stacksync/dist/batch-import');

const PORT = 3000;
// Resolve assets from the installed stacksync package
const STACKSYNC_ROOT = path.dirname(require.resolve('stacksync/package.json'));
const ASSETS_DIR = path.join(STACKSYNC_ROOT, 'assets/logos');
const LUCIDE_DIR = path.join(path.dirname(require.resolve('lucide-static/package.json')), 'icons');
const { DEFAULT_CATEGORY_ICONS } = require('stacksync/dist/defaults');

function getBatchResults() {
    const outputDir = path.join(process.cwd(), 'stacksync/output');
    if (!fs.existsSync(outputDir)) return [];
    
    return fs.readdirSync(outputDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => {
            const stackPath = path.join(outputDir, d.name, 'stack.json');
            if (fs.existsSync(stackPath)) {
                return {
                    name: d.name,
                    stack: JSON.parse(fs.readFileSync(stackPath, 'utf-8'))
                };
            }
            return null;
        })
        .filter(Boolean);
}

const server = http.createServer(async (req, res) => {
    // CORS headers for local dev if needed (though we serve static)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Serve HTML
    if (req.method === 'GET' && req.url === '/') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading index.html');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
        return;
    }

    // API: Run Batch Import
    if (req.method === 'POST' && req.url === '/api/batch-import') {
        try {
            await batchImport();
            const results = getBatchResults();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(results));
        } catch (e) {
            console.error(e);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // API: Get Batch Results
    if (req.method === 'GET' && req.url === '/api/batch-results') {
        try {
            const results = getBatchResults();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(results));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // Serve Assets with Coloring
    if (req.method === 'GET' && req.url.startsWith('/assets/')) {
        const url = new URL(req.url, `http://localhost:${PORT}`);
        const relativePath = url.pathname.replace('/assets/', '');
        
        // Parse query params for color
        const colorMode = url.searchParams.get('colorMode') || 'default';
        const customColor = url.searchParams.get('customColor');
        const iconColor = url.searchParams.get('iconColor'); // Specific override

        let filePath;
        let isDefault = false;

        if (relativePath.startsWith('defaults/')) {
            const iconName = path.basename(relativePath, '.svg');
            filePath = path.join(LUCIDE_DIR, `${iconName}.svg`);
            isDefault = true;
        } else {
            filePath = path.join(ASSETS_DIR, relativePath);
        }

        // Security check
        if (!filePath.startsWith(ASSETS_DIR) && !filePath.startsWith(LUCIDE_DIR)) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }

        fs.readFile(filePath, 'utf8', (err, svgContent) => {
            if (err) {
                res.writeHead(404);
                res.end('Not found');
                return;
            }

            // Apply Coloring Logic
            let color;
            if (iconColor) {
                color = iconColor;
            } else if (colorMode === 'white') {
                color = '#FFFFFF';
            } else if (colorMode === 'black') {
                color = '#000000';
            } else if (colorMode === 'custom' && customColor) {
                color = customColor;
            } else if (colorMode === 'default') {
                if (!isDefault) {
                    const slug = path.basename(relativePath, '.svg');
                    const brandHex = simpleIconsHex[slug];
                    if (brandHex) {
                        color = `#${brandHex}`;
                    }
                }
            }

            if (color) {
                if (isDefault) { // Lucide (stroke)
                    if (svgContent.includes('stroke=')) {
                        svgContent = svgContent.replace(/stroke="[^"]*"/g, `stroke="${color}"`);
                    } else {
                        svgContent = svgContent.replace('<svg', `<svg stroke="${color}"`);
                    }
                } else { // Simple Icons (fill)
                    if (svgContent.includes('fill=')) {
                        svgContent = svgContent.replace(/fill="[^"]*"/g, `fill="${color}"`);
                    } else {
                        svgContent = svgContent.replace('<svg', `<svg fill="${color}"`);
                    }
                }
            }

            res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
            res.end(svgContent);
        });
        return;
    }

    // Scan Endpoint
    if (req.method === 'POST' && req.url === '/scan') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const pkg = JSON.parse(body);
                const deps = {
                    ...pkg.dependencies,
                    ...pkg.devDependencies
                };

                const results = [];
                for (const dep of Object.keys(deps)) {
                    if (techMap[dep]) {
                        const tech = techMap[dep];
                        let logoUrl = tech.logo;
                        
                        // Check if logo exists, if not use default
                        const logoPath = path.join(ASSETS_DIR, tech.logo);
                        if (!fs.existsSync(logoPath)) {
                             const defaultIcon = DEFAULT_CATEGORY_ICONS[tech.type];
                             if (defaultIcon) {
                                 logoUrl = `defaults/${defaultIcon}.svg`;
                             }
                        }

                        results.push({
                            name: tech.name,
                            logoUrl: `/assets/${logoUrl}`
                        });
                    }
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(results));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    res.writeHead(404);
    res.end('Not found');
});

server.listen(PORT, () => {
    console.log(`Playground running at http://localhost:${PORT}`);
});
