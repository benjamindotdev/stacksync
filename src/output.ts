import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { createRequire } from "module";
import { DetectorResult, StackSyncConfig } from "./types";
import { DEFAULT_CATEGORY_ICONS } from "./defaults";
import simpleIconsHex from "./simple-icons-hex.json";

const require = createRequire(import.meta.url);

export async function writeOutput(
    outPath: string,
    techs: DetectorResult[],
    config: StackSyncConfig,
    format: "json" | "markdown" = "json",
    assetsOutPath?: string
) {
    const outDirectory = path.dirname(outPath);
    await fs.ensureDir(outDirectory);

    let availableLogos = new Set<string>();
    if (assetsOutPath) {
        availableLogos = await copyAssets(techs, assetsOutPath, config);
    }

    if (format === "json") {
        await fs.writeJSON(
            outPath,
            {
                generatedAt: new Date().toISOString(),
                tech: techs,
            },
            { spaces: 2 }
        );
        console.log(chalk.blue(`→ Saved ${techs.length} tech entries to ${outPath}`));
    } else if (format === "markdown") {
        // Calculate relative path from output file to assets folder
        const relativeAssetsPath = assetsOutPath 
            ? path.relative(outDirectory, assetsOutPath).replace(/\\/g, "/") 
            : undefined;

        const mdContent = generateMarkdown(techs, relativeAssetsPath, availableLogos);
        // If outPath ends in .json, change it to .md
        const mdPath = outPath.endsWith(".json") 
            ? outPath.replace(/\.json$/, ".md") 
            : outPath;
            
        await fs.writeFile(mdPath, mdContent);
        console.log(chalk.blue(`→ Saved markdown to ${mdPath}`));
    }
}

export async function copyAssets(techs: DetectorResult[], dest: string, config: StackSyncConfig): Promise<Set<string>> {
    // Assume assets are in ../public/assets/logos relative to this file (dist/output.js or src/output.ts)
    const srcDir = path.resolve(__dirname, "../public/assets/logos");
    
    // Resolve lucide-static path reliably
    let lucideDir: string;
    try {
        lucideDir = path.join(path.dirname(require.resolve("lucide-static/package.json")), "icons");
    } catch (e) {
        // Fallback if package.json resolution fails (unlikely)
        lucideDir = path.resolve(__dirname, "../node_modules/lucide-static/icons");
    }
    
    const copied = new Set<string>();
    
    let count = 0;
    for (const t of techs) {
        let srcFile = t.logo ? path.join(srcDir, t.logo) : null;
        let destFile = t.logo ? path.join(dest, t.logo) : null;
        let isDefault = false;

        // Check if custom logo exists
        if (!srcFile || !(await fs.pathExists(srcFile))) {
            // Try to find a default icon for the category
            const defaultIconName = DEFAULT_CATEGORY_ICONS[t.type];
            if (defaultIconName) {
                const lucideFile = path.join(lucideDir, `${defaultIconName}.svg`);
                if (await fs.pathExists(lucideFile)) {
                    srcFile = lucideFile;
                    // Use a consistent path for defaults in the output
                    const newLogoPath = `defaults/${defaultIconName}.svg`;
                    destFile = path.join(dest, newLogoPath);
                    
                    // Update the tech object so the markdown generator uses the default logo
                    t.logo = newLogoPath;
                    isDefault = true;
                }
            }
        }
        
        if (srcFile && destFile && (await fs.pathExists(srcFile))) {
            await fs.ensureDir(path.dirname(destFile));
            
            // Read SVG content
            let svgContent = await fs.readFile(srcFile, 'utf8');
            
            // Determine color
            let color: string | undefined;
            
            // 1. Per-icon override
            if (config.iconColors && config.iconColors[t.name]) {
                color = config.iconColors[t.name];
            } 
            // 2. Global mode
            else if (config.colorMode === 'white') {
                color = '#FFFFFF';
            } else if (config.colorMode === 'black') {
                color = '#000000';
            } else if (config.colorMode === 'custom' && config.customColor) {
                color = config.customColor;
            } 
            // 3. Default mode (Brand color)
            else if (config.colorMode === 'default' || !config.colorMode || config.colorMode === 'brand') {
                if (!isDefault) {
                    // Try to find brand color for Simple Icons
                    const slug = path.basename(t.logo, '.svg');
                    // @ts-ignore
                    const brandHex = (simpleIconsHex as any)[slug] || (simpleIconsHex as any)[slug.toLowerCase()];
                    if (brandHex) {
                        color = `#${brandHex}`;
                    }
                }
            }

            // Apply color if found
            if (color) {
                if (isDefault) { // Lucide icon (stroke based)
                     // Replace stroke="currentColor" or existing stroke
                     if (svgContent.includes('stroke=')) {
                        svgContent = svgContent.replace(/stroke="[^"]*"/g, `stroke="${color}"`);
                     } else {
                        svgContent = svgContent.replace('<svg', `<svg stroke="${color}"`);
                     }
                } else { // Simple Icon (fill based)
                     // Check if fill is already present
                     if (svgContent.includes('fill=')) {
                         svgContent = svgContent.replace(/fill="[^"]*"/g, `fill="${color}"`);
                     } else {
                         // Add fill to svg tag
                         svgContent = svgContent.replace('<svg', `<svg fill="${color}"`);
                     }
                }
            }

            await fs.writeFile(destFile, svgContent);
            copied.add(t.logo);
            if (!isDefault) count++;
        } else {
            // console.warn(`Warning: Logo not found for ${t.name} at ${srcFile}`);
        }
    }
    if (count > 0) {
        console.log(chalk.blue(`→ Copied ${count} logos to ${dest}`));
    }
    return copied;
}

export function generateMarkdown(techs: DetectorResult[], assetsPath?: string, availableLogos?: Set<string>): string {
    // Group by type
    const grouped: Record<string, DetectorResult[]> = {};
    for (const t of techs) {
        const type = t.type || "misc";
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push(t);
    }

    let md = "# Tech Stack\n\n";

    // Define a nice order for sections
    const order = [
        "language", "frontend", "backend", "framework", "library", 
        "database", "orm", "auth", "api", "cloud", "hosting", 
        "ci", "devops", "container", "testing", "build", "tooling", "misc"
    ];

    // Sort keys based on order, putting unknown types at the end
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
        const idxA = order.indexOf(a);
        const idxB = order.indexOf(b);
        if (idxA === -1 && idxB === -1) return a.localeCompare(b);
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
    });

    for (const type of sortedKeys) {
        const title = type.charAt(0).toUpperCase() + type.slice(1);
        md += `## ${title}\n\n`;
        
        for (const t of grouped[type]) {
            if (t.logo && (t.logo.startsWith('http') || t.logo.startsWith('//'))) {
                 md += `- <img src="${t.logo}" alt="${t.name}" width="24" height="24" /> **${t.name}**\n`;
            } else if (assetsPath && t.logo && availableLogos?.has(t.logo)) {
                const logoUrl = `${assetsPath}/${t.logo}`;
                md += `- <img src="${logoUrl}" alt="${t.name}" width="24" height="24" /> **${t.name}**\n`;
            } else {
                md += `- **${t.name}**\n`;
            }
        }
        md += "\n";
    }

    return md;
}
