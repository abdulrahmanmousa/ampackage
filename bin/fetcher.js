import fs from 'fs-extra';
import path from 'path';
import fetch from 'node-fetch';
import { getCacheDir } from './config.js';

// Helper function to get file extension based on type
function getFileExtension(type) {
  return type === 'component' ? '.tsx' : '.ts';
}

// Helper function to pluralize type
function pluralizeType(type) {
  return type + 's';
}

// Cache manager
class CacheManager {
  constructor() {
    this.cacheDir = getCacheDir();
  }

  async ensureCacheDir() {
    await fs.ensureDir(this.cacheDir);
  }

  getCachePath(source, type, name) {
    return path.join(this.cacheDir, source.name, pluralizeType(type), name + getFileExtension(type));
  }

  getSourceCacheDir(source) {
    return path.join(this.cacheDir, source.name);
  }

  async isCacheValid(cachePath, ttl = 3600000) {
    try {
      const stats = await fs.stat(cachePath);
      const age = Date.now() - stats.mtime.getTime();
      return age < ttl;
    } catch {
      return false;
    }
  }

  async getCachedFile(source, type, name, ttl) {
    const cachePath = this.getCachePath(source, type, name);
    
    if (await fs.pathExists(cachePath) && await this.isCacheValid(cachePath, ttl)) {
      return await fs.readFile(cachePath, 'utf8');
    }
    
    return null;
  }

  async setCachedFile(source, type, name, content) {
    const cachePath = this.getCachePath(source, type, name);
    await fs.ensureDir(path.dirname(cachePath));
    await fs.writeFile(cachePath, content, 'utf8');
  }

  async listCachedTemplates(source, type) {
    const typeDir = path.join(this.cacheDir, source.name, pluralizeType(type));
    
    if (!(await fs.pathExists(typeDir))) {
      return [];
    }
    
    const files = await fs.readdir(typeDir);
    return files
      .filter(file => file.endsWith('.ts') || file.endsWith('.tsx'))
      .map(file => path.parse(file).name);
  }
}

// Remote fetchers for different source types
class GitHubFetcher {
  constructor(source) {
    this.source = source;
    this.cache = new CacheManager();
  }

  // Convert GitHub repo URL to raw file URL
  buildRawUrl(type, name) {
    const { url, branch = 'main', path: basePath = 'templates' } = this.source;
    
    // Handle different GitHub URL formats
    let repoPath;
    if (url.includes('github.com')) {
      repoPath = url.replace('https://github.com/', '').replace('.git', '');
    } else {
      throw new Error('Invalid GitHub URL format');
    }
    
    return `https://raw.githubusercontent.com/${repoPath}/${branch}/${basePath}/${pluralizeType(type)}/${name}${getFileExtension(type)}`;
  }

  async fetchFile(type, name, useCache = true) {
    if (useCache) {
      const cached = await this.cache.getCachedFile(this.source, type, name, 3600000);
      if (cached) return cached;
    }

    const url = this.buildRawUrl(type, name);
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Template not found: ${type}/${name}`);
        }
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      
      const content = await response.text();
      
      // Cache the content
      await this.cache.setCachedFile(this.source, type, name, content);
      
      return content;
    } catch (error) {
      throw new Error(`Failed to fetch from GitHub: ${error.message}`);
    }
  }

  async listTemplates(type, useCache = true) {
    // For GitHub, we'll rely on cache or return empty for now
    // In a full implementation, we'd use GitHub API to list files
    if (useCache) {
      return await this.cache.listCachedTemplates(this.source, type);
    }
    return [];
  }
}

class NpmFetcher {
  constructor(source) {
    this.source = source;
    this.cache = new CacheManager();
  }

  async fetchFile(type, name, useCache = true) {
    if (useCache) {
      const cached = await this.cache.getCachedFile(this.source, type, name, 3600000);
      if (cached) return cached;
    }

    // For npm packages, we'd need to download and extract
    // This is a placeholder for the full implementation
    throw new Error('NPM source fetching not yet implemented');
  }

  async listTemplates(type, useCache = true) {
    if (useCache) {
      return await this.cache.listCachedTemplates(this.source, type);
    }
    return [];
  }
}

class LocalFetcher {
  constructor(source, packageRoot) {
    this.source = source;
    this.packageRoot = packageRoot;
  }

  getLocalPath() {
    const localPath = this.source.path || './templates';
    return path.isAbsolute(localPath) ? localPath : path.join(this.packageRoot, localPath);
  }

  async fetchFile(type, name) {
    const templatesDir = this.getLocalPath();
    const filePath = path.join(templatesDir, pluralizeType(type), name + getFileExtension(type));
    
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`Template not found: ${type}/${name}`);
    }
    
    return await fs.readFile(filePath, 'utf8');
  }

  async listTemplates(type) {
    const templatesDir = this.getLocalPath();
    const typeDir = path.join(templatesDir, pluralizeType(type));
    
    if (!(await fs.pathExists(typeDir))) {
      return [];
    }
    
    const files = await fs.readdir(typeDir);
    return files
      .filter(file => file.endsWith('.ts') || file.endsWith('.tsx'))
      .map(file => path.parse(file).name);
  }
}

// Factory function to create appropriate fetcher
export function createFetcher(source, packageRoot) {
  switch (source.type) {
    case 'github':
      return new GitHubFetcher(source);
    case 'npm':
      return new NpmFetcher(source);
    case 'local':
    default:
      return new LocalFetcher(source, packageRoot);
  }
}

// Main functions to fetch from all sources
export async function fetchTemplate(sources, type, name, packageRoot) {
  const errors = [];
  
  for (const source of sources) {
    try {
      const fetcher = createFetcher(source, packageRoot);
      const content = await fetcher.fetchFile(type, name);
      return { content, source };
    } catch (error) {
      errors.push(`${source.name}: ${error.message}`);
    }
  }
  
  throw new Error(`Template not found in any source:\n${errors.join('\n')}`);
}

export async function listAllTemplates(sources, packageRoot) {
  const types = ['component', 'hook', 'util'];
  const allTemplates = {};
  
  for (const type of types) {
    allTemplates[type] = new Set();
  }
  
  for (const source of sources) {
    try {
      const fetcher = createFetcher(source, packageRoot);
      
      for (const type of types) {
        const templates = await fetcher.listTemplates(type);
        templates.forEach(template => allTemplates[type].add(template));
      }
    } catch (error) {
      console.warn(`⚠️  Warning: Could not list templates from ${source.name}: ${error.message}`);
    }
  }
  
  // Convert sets to arrays
  for (const type of types) {
    allTemplates[type] = Array.from(allTemplates[type]).sort();
  }
  
  return allTemplates;
}