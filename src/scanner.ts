import fs from "fs-extra";
import path from "path";
import { techMap } from "./techMap";
import { detectNext } from "./detectors/next";
import { detectPrisma } from "./detectors/prisma";
import { detectCI } from "./detectors/ci";
import { detectDocker } from "./detectors/docker";
import { DetectorResult, StackSyncConfig } from "./types";
import simpleIconsHex from "./simple-icons-hex.json";

export async function scanRepo(
    repoPath: string,
    config: StackSyncConfig
): Promise<DetectorResult[]> {
    const pkgPath = path.join(repoPath, "package.json");

    if (!fs.existsSync(pkgPath)) throw new Error("package.json not found");

    const pkg = await fs.readJSON(pkgPath);
    const deps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
    };

    const results: DetectorResult[] = [];

    const getColor = (slug: string, techName: string) => {
        if (config.colorMode === 'white') return '#FFFFFF';
        if (config.colorMode === 'black') return '#000000';
        if (config.colorMode && config.colorMode.startsWith('#')) return config.colorMode;
        
        // Default / Brand
        const hex = (simpleIconsHex as any)[slug] || (simpleIconsHex as any)[techName.toLowerCase()];
        return hex ? `#${hex}` : undefined;
    };

    for (const dep of Object.keys(deps)) {
        if (config.ignore?.includes(dep)) continue;

        if (techMap[dep]) {
            const base = techMap[dep];
            results.push({
                ...base,
                color: getColor(dep, base.name)
            });
        }
    }

    // File-based detectors
    const detectors = [detectNext, detectPrisma, detectCI, detectDocker];

    for (const detector of detectors) {
        const out = await detector(repoPath);
        if (out) {
            // For file detectors, we don't have a "dep" slug easily.
            // We can try to guess from the name or just use the name.
            results.push({
                ...out,
                color: getColor(out.name.toLowerCase(), out.name)
            });
        }
    }

    return results;
}
