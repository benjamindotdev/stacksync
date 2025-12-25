#!/usr/bin / env node
import { Command } from "commander";
import { loadConfig } from "./config";
import { scanRepo } from "./scanner";
import { writeOutput } from "./output";
import chalk from "chalk";

const program = new Command();

program
    .name("stacksync")
    .description("Auto-detect tech stacks and generate tech.json or markdown.")
    .version("0.1.0");

program
    .argument("[repo]", "Path to repo", ".")
    .option("--out <path>", "Output file path", "./tech.json")
    .option("--format <format>", "Output format (json, markdown)", "json")
    .option("--json", "Shortcut for --format json")
    .option("--assets <path>", "Path to copy logo assets to")
    .option("--ignore <packages>", "Comma-separated list of packages to ignore")
    .option("--config <path>", "Path to config file")
    .action(async (repo, options) => {
        try {
            const config = await loadConfig(options.config);
            
            // Merge CLI ignores
            if (options.ignore) {
                const cliIgnores = options.ignore.split(",").map((s: string) => s.trim());
                config.ignore = [...(config.ignore || []), ...cliIgnores];
            }

            // Handle --json shortcut
            const format = options.json ? "json" : options.format;

            const result = await scanRepo(repo, config);

            await writeOutput(
                options.out, 
                result, 
                config, 
                format as "json" | "markdown",
                options.assets
            );

            console.log(chalk.green("✔ Tech stack generated successfully!"));
            process.exit(0);
        } catch (error) {
            console.error(chalk.red("✖ Failed to generate tech stack:"));
            if (error instanceof Error) {
                console.error(chalk.red(error.message));
            } else {
                console.error(chalk.red(String(error)));
            }
            process.exit(1);
        }
    });

program.parse();
