#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadConfig, saveConfig, addSource, removeSource, getSources } from './config.js';
import { fetchTemplate, listAllTemplates } from './fetcher.js';
import { pushToRemote } from './git-pusher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');

// Helper function to get templates directory (for backward compatibility)
function getTemplatesDir() {
  return path.join(packageRoot, 'templates');
}

// Helper function to get current working directory
function getCurrentWorkingDir() {
  return process.cwd();
}

// Helper function to pluralize type
function pluralizeType(type) {
  return type + 's';
}

// Helper function to get file extension based on type
function getFileExtension(type) {
  return type === 'component' ? '.tsx' : '.ts';
}

// List command - updated to use remote sources
program
  .command('list')
  .description('List all available templates from all sources')
  .option('--source <name>', 'List templates from specific source only')
  .action(async (options) => {
    try {
      const config = await loadConfig();
      let sources = config.sources;
      
      if (options.source) {
        sources = sources.filter(s => s.name === options.source);
        if (sources.length === 0) {
          console.error(`❌ Source '${options.source}' not found`);
          process.exit(1);
        }
      }
      
      console.log('\n📋 Available templates:\n');
      
      const allTemplates = await listAllTemplates(sources, packageRoot);
      
      for (const [type, templates] of Object.entries(allTemplates)) {
        if (templates.length > 0) {
          console.log(`${type}:`);
          templates.forEach(template => {
            console.log(`  - ${template}`);
          });
          console.log('');
        }
      }
      
      if (sources.length > 1) {
        console.log(`📍 Sources: ${sources.map(s => s.name).join(', ')}`);
      }
    } catch (error) {
      console.error('❌ Error listing templates:', error.message);
      process.exit(1);
    }
  });

// Add command - updated to use remote sources
program
  .command('add')
  .argument('<type>', 'Type of template (component, hook, util)')
  .argument('<names...>', 'Name(s) of template(s) to add')
  .option('--dest <path>', 'Custom destination directory', 'src')
  .option('--overwrite', 'Overwrite existing files without confirmation')
  .option('--source <name>', 'Fetch from specific source only')
  .description('Add template(s) to your project from configured sources')
  .action(async (type, names, options) => {
    try {
      const config = await loadConfig();
      let sources = config.sources;
      
      if (options.source) {
        sources = sources.filter(s => s.name === options.source);
        if (sources.length === 0) {
          console.error(`❌ Source '${options.source}' not found`);
          process.exit(1);
        }
      }
      
      const targetDir = getCurrentWorkingDir();
      const destDir = options.dest;
      let hasErrors = false;
      
      for (const name of names) {
        try {
          const targetFile = path.join(targetDir, destDir, pluralizeType(type), name + getFileExtension(type));
          
          // Check if target file exists
          if (await fs.pathExists(targetFile) && !options.overwrite) {
            console.log(`⚠️  File already exists: ${targetFile}`);
            console.log('Use --overwrite flag to overwrite existing files');
            continue;
          }
          
          // Fetch template from sources
          const { content, source } = await fetchTemplate(sources, type, name, packageRoot);
          
          // Create target directory if it doesn't exist
          await fs.ensureDir(path.dirname(targetFile));
          
          // Write file
          await fs.writeFile(targetFile, content, 'utf8');
          console.log(`✅ Added ${type}: ${name} → ${targetFile} (from ${source.name})`);
        } catch (error) {
          console.error(`❌ Failed to add ${type}/${name}: ${error.message}`);
          hasErrors = true;
        }
      }
      
      if (hasErrors) {
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error adding template:', error.message);
      process.exit(1);
    }
  });

// Push command - updated to support remote sources
program
  .command('push')
  .argument('<type>', 'Type of template (component, hook, util)')
  .argument('<name>', 'Name of template to push')
  .option('--overwrite', 'Overwrite existing template without confirmation')
  .option('--source <name>', 'Push to specific source (default: local)')
  .option('--pr', 'Create a pull request instead of direct push (for Git sources)')
  .option('--message <msg>', 'Commit message for Git sources')
  .description('Push a file from your project to a template source')
  .action(async (type, name, options) => {
    try {
      const config = await loadConfig();
      const targetDir = getCurrentWorkingDir();
      
      // Determine target source
      let targetSource;
      if (options.source) {
        targetSource = config.sources.find(s => s.name === options.source);
        if (!targetSource) {
          console.error(`❌ Source '${options.source}' not found`);
          process.exit(1);
        }
      } else {
        // Default to local source
        targetSource = config.sources.find(s => s.type === 'local') || config.sources[0];
      }
      
      const sourceFile = path.join(targetDir, 'src', pluralizeType(type), name + getFileExtension(type));
      
      // Check if source file exists
      if (!(await fs.pathExists(sourceFile))) {
        console.error(`❌ Source file not found: ${sourceFile}`);
        process.exit(1);
      }
      
      const content = await fs.readFile(sourceFile, 'utf8');
      
      if (targetSource.type === 'local') {
        // Handle local push (original behavior)
        const templatesDir = getTemplatesDir();
        const templateFile = path.join(templatesDir, pluralizeType(type), name + getFileExtension(type));
        
        // Check if template file exists
        if (await fs.pathExists(templateFile) && !options.overwrite) {
          console.log(`⚠️  Template already exists: ${templateFile}`);
          console.log('Use --overwrite flag to overwrite existing template');
          return;
        }
        
        // Create template directory if it doesn't exist
        await fs.ensureDir(path.dirname(templateFile));
        
        // Copy file
        await fs.copy(sourceFile, templateFile);
        console.log(`✅ Pushed ${type}: ${name} → ${templateFile}`);
      } else {
        // Handle remote push
        const pushOptions = {
          createPR: options.pr,
          commitMessage: options.message,
          title: `Add ${type}: ${name}`,
          description: `Adding ${type} template: ${name}`
        };
        
        const result = await pushToRemote(targetSource, type, name, content, pushOptions);
        
        if (result) {
          if (options.pr) {
            console.log(`✅ Created pull request for ${type}: ${name}`);
            console.log(`🔗 ${result.url}`);
          } else {
            console.log(`✅ Pushed ${type}: ${name} to ${targetSource.name}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error pushing template:', error.message);
      process.exit(1);
    }
  });

// Source management commands
const sourceCommand = program
  .command('source')
  .description('Manage template sources');

// Add source command
sourceCommand
  .command('add')
  .argument('<name>', 'Source name')
  .argument('<type>', 'Source type (github, npm, local)')
  .argument('<url>', 'Source URL or path')
  .option('--branch <branch>', 'Git branch (for GitHub sources)', 'main')
  .option('--path <path>', 'Base path within source', 'templates')
  .option('--default', 'Set as default source')
  .description('Add a new template source')
  .action(async (name, type, url, options) => {
    try {
      const sourceOptions = {
        branch: options.branch,
        path: options.path,
        default: options.default
      };
      
      const source = await addSource(name, type, url, sourceOptions);
      console.log(`✅ Added source: ${name} (${type})`);
      console.log(`   URL: ${url}`);
      if (options.branch) console.log(`   Branch: ${options.branch}`);
      if (options.path) console.log(`   Path: ${options.path}`);
    } catch (error) {
      console.error('❌ Error adding source:', error.message);
      process.exit(1);
    }
  });

// Remove source command
sourceCommand
  .command('remove')
  .argument('<name>', 'Source name to remove')
  .description('Remove a template source')
  .action(async (name) => {
    try {
      await removeSource(name);
      console.log(`✅ Removed source: ${name}`);
    } catch (error) {
      console.error('❌ Error removing source:', error.message);
      process.exit(1);
    }
  });

// List sources command
sourceCommand
  .command('list')
  .description('List all configured sources')
  .action(async () => {
    try {
      const sources = await getSources();
      
      if (sources.length === 0) {
        console.log('No sources configured');
        return;
      }
      
      console.log('\n📍 Configured sources:\n');
      
      sources.forEach((source, index) => {
        console.log(`${index + 1}. ${source.name} (${source.type})`);
        if (source.url) console.log(`   URL: ${source.url}`);
        if (source.path) console.log(`   Path: ${source.path}`);
        if (source.branch) console.log(`   Branch: ${source.branch}`);
        if (source.default) console.log(`   Default: Yes`);
        console.log('');
      });
    } catch (error) {
      console.error('❌ Error listing sources:', error.message);
      process.exit(1);
    }
  });

program
  .name('ampackage')
  .description('CLI tool for managing components, hooks, and utils with remote sources')
  .version('1.0.0');

program.parse();