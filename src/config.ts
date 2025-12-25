import { cosmiconfig } from "cosmiconfig";
import { StackSyncConfig } from "./types";

export async function loadConfig(configPath?: string): Promise<StackSyncConfig> {
    const explorer = cosmiconfig("stacksync");

    const result = configPath 
        ? await explorer.load(configPath)
        : await explorer.search();

    const defaultConfig: StackSyncConfig = {
        ignore: [],
        aliases: {},
        logosPath: "/public/tech/",
        colorMode: 'default'
    };

    return { ...defaultConfig, ...result?.config };
}
