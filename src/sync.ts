import fs from 'fs';
import path from 'path';
import { techMap } from './techMap';
import simpleIconsHex from './simple-icons-hex.json';
import { generateMarkdown, copyAssets } from './output';

const BASE_DIR = path.join(process.cwd(), 'stacksync');

const SKIPPED_TECHS = [
  'react-dom',
];

// Helper to convert "example project" -> "exampleProject"
function toCamelCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9 ]/g, "") // Remove special chars
    .split(' ')
    .map((word, index) => {
      if (index === 0) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}

interface SyncOptions {
  color?: string;
  copyAssets?: boolean;
}

async function sync(options: SyncOptions = {}) {
  console.log('🚀 Starting Sync...');
  if (options.color) {
    console.log(`🎨 Color mode: ${options.color}`);
  }

  if (!fs.existsSync(BASE_DIR)) {
    console.log(`Creating stacksync directory at: ${BASE_DIR}`);
    fs.mkdirSync(BASE_DIR, { recursive: true });
    console.log('Please place your project folders inside "stacksync/" and run this command again.');
    process.exit(0);
  }

  const entries = fs.readdirSync(BASE_DIR, { withFileTypes: true });
  const projectDirs = entries.filter(dirent => dirent.isDirectory() && dirent.name !== 'input' && dirent.name !== 'output');

  if (projectDirs.length === 0) {
    console.log('⚠️  No project directories found in "stacksync/".');
    return;
  }

  console.log(`Found ${projectDirs.length} projects to process.\n`);

  const allProjects: { name: string; techs: any[] }[] = [];
  const allTechs: any[] = [];

  for (const dir of projectDirs) {
    const projectPath = path.join(BASE_DIR, dir.name);
    const packageJsonPath = path.join(projectPath, 'package.json');

    if (fs.existsSync(packageJsonPath)) {
      try {
        const content = fs.readFileSync(packageJsonPath, 'utf-8');
        const pkg = JSON.parse(content);
        
        // 1. Detect Tech
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        const detectedTechs: any[] = [];

        Object.keys(allDeps).forEach(dep => {
          if (SKIPPED_TECHS.includes(dep)) return;

          if (techMap[dep]) {
            const tech = techMap[dep];
            
            // Determine Color
            let color = null;
            if (options.color === 'white') color = '#FFFFFF';
            else if (options.color === 'black') color = '#000000';
            else if (options.color && options.color.startsWith('#')) color = options.color;
            else {
               // Default to brand color
               // Try to find hex by:
               // 1. Exact dependency name (e.g. "react")
               // 2. Tech name lowercased (e.g. "React" -> "react")
               // 3. Tech name with spaces removed (e.g. "Tailwind CSS" -> "tailwindcss")
               const depSlug = dep.toLowerCase();
               const nameSlug = tech.name.toLowerCase();
               const nameSlugNoSpaces = tech.name.toLowerCase().replace(/\s+/g, '');
               
               const hex = (simpleIconsHex as any)[depSlug] || 
                           (simpleIconsHex as any)[nameSlug] || 
                           (simpleIconsHex as any)[nameSlugNoSpaces];
                           
               if (hex) color = `#${hex}`;
            }

            detectedTechs.push({
              name: tech.name,
              slug: dep,
              logo: tech.logo, // Raw path for resolution
              color: color
            });
          }
        });

        // 2. Deduplicate by slug
        let uniqueTechs = Array.from(new Set(detectedTechs.map(t => t.slug)))
          .map(slug => detectedTechs.find(t => t.slug === slug)!);

        // 3. Deduplicate by logo (avoid showing same logo multiple times)
        const seenLogos = new Set<string>();
        uniqueTechs = uniqueTechs.filter(t => {
            if (seenLogos.has(t.logo)) {
                return false;
            }
            seenLogos.add(t.logo);
            return true;
        });
        
        // Resolve Assets (Copy & Fallback)
        const assetsDir = path.join(process.cwd(), 'public', 'assets', 'logos');
        if (options.copyAssets !== false) {
             await copyAssets(uniqueTechs, assetsDir, { colorMode: options.color as any });
        }

        // Create URL-based version for Output
        const techsWithUrls = uniqueTechs.map(t => ({
            ...t,
            logo: `https://raw.githubusercontent.com/benjamindotdev/stacksync/main/public/assets/logos/${t.logo}`,
            relativePath: `./public/assets/logos/${t.logo}`
        }));
        
        allTechs.push(...techsWithUrls);

        // 3. Prepare Output (In-place)
        // We write directly to the project folder
        
        // 4. Write File
        fs.writeFileSync(
          path.join(projectPath, 'stack.json'), 
          JSON.stringify(techsWithUrls, null, 2)
        );

        // 5. Generate Markdown
        const mdContent = generateMarkdown(techsWithUrls);
        fs.writeFileSync(path.join(projectPath, 'stack.md'), mdContent);

        // Store for root README update
        allProjects.push({
            name: dir.name,
            techs: techsWithUrls
        });

        console.log(`✅ ${dir.name.padEnd(20)} -> stack.json (${uniqueTechs.length} techs)`);

      } catch (err: any) {
        console.error(`❌ Error processing ${dir.name}:`, err.message);
      }
    } else {
      console.warn(`⚠️  Skipping "${dir.name}": No package.json found.`);
    }
  }

  // Update Root README
  if (allProjects.length > 0) {
      updateRootReadme(allProjects);
  }

  console.log('\n✨ Sync complete.');
}

function updateRootReadme(projects: { name: string; techs: any[] }[]) {
    const readmePath = path.join(process.cwd(), 'README.md');
    if (!fs.existsSync(readmePath)) {
        console.log('⚠️  No root README.md found to update.');
        return;
    }

    let readmeContent = fs.readFileSync(readmePath, 'utf-8');
    const startMarker = '<!-- STACKSYNC_START -->';
    const endMarker = '<!-- STACKSYNC_END -->';

    let newSection = `${startMarker}\n## My Projects\n\n`;
    
    for (const p of projects) {
        newSection += `### ${p.name}\n`;
        newSection += `<p>\n`;
        for (const t of p.techs) {
            const src = t.relativePath || t.logo;
            newSection += `  <img src="${src}" alt="${t.name}" height="25" style="margin-right: 10px;" />\n`;
        }
        newSection += `</p>\n\n`;
    }
    newSection += `${endMarker}`;

    if (readmeContent.includes(startMarker) && readmeContent.includes(endMarker)) {
        const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`);
        readmeContent = readmeContent.replace(regex, newSection);
        console.log(`📝 Updated root README.md with ${projects.length} projects.`);
    } else {
        readmeContent += `\n\n${newSection}`;
        console.log(`📝 Appended projects to root README.md.`);
    }

    fs.writeFileSync(readmePath, readmeContent);
}


export { sync };
