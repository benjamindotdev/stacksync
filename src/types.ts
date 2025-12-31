export interface DetectorResult {
    name: string;
    logo: string;
    type: string;
    color?: string;
}

export interface TechDefinition {
    id: string;
    name: string;
    aliases: string[]; // npm package names
    category: string;
    logo: string;
    frameworks?: string[];
}

export interface StackSyncConfig {
    ignore?: string[];
    aliases?: Record<string, string>;
    logosPath?: string;
    colorMode?: 'default' | 'white' | 'black' | 'custom' | 'brand';
    customColor?: string;
    iconColors?: Record<string, string>;
}
