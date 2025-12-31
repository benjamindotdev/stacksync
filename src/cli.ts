#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";

import { sync } from "./sync";
import { add } from "./add";

const program = new Command();

program
    .name("stacksync")
    .description("Auto-detect tech stacks and generate tech.json or markdown.")
    .version("0.1.0");

program
    .command("sync", { isDefault: true })
    .description("Sync stacks from multiple projects in stacksync/")
    .option("--color <mode>", "Color mode (brand, white, black, or hex)", "brand")
    .action(async (options) => {
        await sync(options);
    });

program
    .command("add <path>")
    .description("Add a project (folder or package.json) to the stacksync workspace")
    .action(async (path) => {
        await add(path);
    });

program.parse();
