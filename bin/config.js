import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const CONFIG_FILE_NAME = '.ampackage.json';

// Helper function to get config file path
function getConfigPath() {
  // First try current working directory
  const localConfig = path.join(process.cwd(), CONFIG_FILE_NAME);
  if (fs.existsSync(localConfig)) {
    return localConfig;
  }
  
  // Fallback to home directory
  return path.join(os.homedir(), CONFIG_FILE_NAME);
}

// Default configuration
const defaultConfig = {
  sources: [
    {
      name: 'local',
      type: 'local',
      path: './templates',
      default: true
    }
  ],
  cache: {
    enabled: true,
    ttl: 3600000 // 1 hour in milliseconds
  }
};

// Load configuration
export async function loadConfig() {
  try {
    const configPath = getConfigPath();
    
    if (await fs.pathExists(configPath)) {
      const config = await fs.readJson(configPath);
      return { ...defaultConfig, ...config };
    }
    
    return defaultConfig;
  } catch (error) {
    console.warn('⚠️  Error loading config, using defaults:', error.message);
    return defaultConfig;
  }
}

// Save configuration
export async function saveConfig(config) {
  try {
    const configPath = getConfigPath();
    await fs.writeJson(configPath, config, { spaces: 2 });
    return configPath;
  } catch (error) {
    console.error('❌ Error saving config:', error.message);
    throw error;
  }
}

// Add a new source
export async function addSource(name, type, url, options = {}) {
  const config = await loadConfig();
  
  // Check if source already exists
  const existingIndex = config.sources.findIndex(s => s.name === name);
  
  const source = {
    name,
    type,
    url,
    ...options
  };
  
  if (existingIndex >= 0) {
    config.sources[existingIndex] = source;
  } else {
    config.sources.push(source);
  }
  
  await saveConfig(config);
  return source;
}

// Remove a source
export async function removeSource(name) {
  const config = await loadConfig();
  const initialLength = config.sources.length;
  
  config.sources = config.sources.filter(s => s.name !== name);
  
  if (config.sources.length === initialLength) {
    throw new Error(`Source '${name}' not found`);
  }
  
  await saveConfig(config);
  return true;
}

// Get all sources
export async function getSources() {
  const config = await loadConfig();
  return config.sources;
}

// Get a specific source
export async function getSource(name) {
  const config = await loadConfig();
  return config.sources.find(s => s.name === name);
}

// Get cache directory
export function getCacheDir() {
  return path.join(os.homedir(), '.ampackage', 'cache');
}