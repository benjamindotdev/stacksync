import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

const BASE_DIR = path.join(process.cwd(), 'stacksync');

export async function add(sourcePath: string) {
    let absoluteSourcePath = path.resolve(sourcePath);

    if (!fs.existsSync(absoluteSourcePath)) {
        console.error(chalk.red(`❌ Path not found: ${sourcePath}`));
        process.exit(1);
    }

    // If directory is provided, look for package.json inside
    if (fs.statSync(absoluteSourcePath).isDirectory()) {
        absoluteSourcePath = path.join(absoluteSourcePath, 'package.json');
        if (!fs.existsSync(absoluteSourcePath)) {
            console.error(chalk.red(`❌ No package.json found in directory: ${sourcePath}`));
            process.exit(1);
        }
    }

    try {
        const content = fs.readFileSync(absoluteSourcePath, 'utf-8');
        const pkg = JSON.parse(content);

        if (!pkg.name) {
            console.error(chalk.red(`❌ No "name" field found in ${sourcePath}`));
            process.exit(1);
        }

        // Sanitize name for folder usage (handle scoped packages @org/repo -> org-repo)
        const baseFolderName = pkg.name.replace(/^@/, '').replace(/\//g, '-');
        let folderName = baseFolderName;
        let targetDir = path.join(BASE_DIR, folderName);

        // Handle collisions by appending a number to the folder name
        let counter = 1;
        while (fs.existsSync(targetDir)) {
            folderName = `${baseFolderName}-${counter}`;
            targetDir = path.join(BASE_DIR, folderName);
            counter++;
        }

        const targetFile = path.join(targetDir, 'package.json');

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        fs.copyFileSync(absoluteSourcePath, targetFile);
        console.log(chalk.green(`✅ Added project "${pkg.name}" to stacksync/${folderName}`));

    } catch (error) {
        console.error(chalk.red(`❌ Error processing ${sourcePath}:`), error);
        process.exit(1);
    }
}
