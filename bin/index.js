#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');

// Helper function to get templates directory
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

// List command
program
  .command('list')
  .description('List all available templates')
  .action(async () => {
    try {
      const templatesDir = getTemplatesDir();
      const types = ['components', 'hooks', 'utils'];
      
      console.log('\n📋 Available templates:\n');
      
      for (const type of types) {
        const typeDir = path.join(templatesDir, type);
        
        if (await fs.pathExists(typeDir)) {
          const files = await fs.readdir(typeDir);
          const templates = files
            .filter(file => file.endsWith('.ts') || file.endsWith('.tsx'))
            .map(file => path.parse(file).name);
          
          if (templates.length > 0) {
            console.log(`${type}:`);
            templates.forEach(template => {
              console.log(`  - ${template}`);
            });
            console.log('');
          }
        }
      }
    } catch (error) {
      console.error('❌ Error listing templates:', error.message);
      process.exit(1);
    }
  });

// Add command
program
  .command('add')
  .argument('<type>', 'Type of template (component, hook, util)')
  .argument('<names...>', 'Name(s) of template(s) to add')
  .option('--dest <path>', 'Custom destination directory', 'src')
  .option('--overwrite', 'Overwrite existing files without confirmation')
  .description('Add template(s) to your project')
  .action(async (type, names, options) => {
    try {
      const templatesDir = getTemplatesDir();
      const targetDir = getCurrentWorkingDir();
      const destDir = options.dest;
      let hasErrors = false;
      
      for (const name of names) {
        const sourceFile = path.join(templatesDir, pluralizeType(type), name + getFileExtension(type));
        const targetFile = path.join(targetDir, destDir, pluralizeType(type), name + getFileExtension(type));
        
        // Check if template exists
        if (!(await fs.pathExists(sourceFile))) {
          console.error(`❌ Template not found: ${type}/${name}`);
          hasErrors = true;
          continue;
        }
        
        // Check if target file exists
        if (await fs.pathExists(targetFile) && !options.overwrite) {
          console.log(`⚠️  File already exists: ${targetFile}`);
          console.log('Use --overwrite flag to overwrite existing files');
          continue;
        }
        
        // Create target directory if it doesn't exist
        await fs.ensureDir(path.dirname(targetFile));
        
        // Copy file
        await fs.copy(sourceFile, targetFile);
        console.log(`✅ Added ${type}: ${name} → ${targetFile}`);
      }
      
      if (hasErrors) {
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error adding template:', error.message);
      process.exit(1);
    }
  });

// Push command
program
  .command('push')
  .argument('<type>', 'Type of template (component, hook, util)')
  .argument('<name>', 'Name of template to push')
  .option('--overwrite', 'Overwrite existing template without confirmation')
  .description('Push a file from your project to the templates library')
  .action(async (type, name, options) => {
    try {
      const templatesDir = getTemplatesDir();
      const targetDir = getCurrentWorkingDir();
      
      const sourceFile = path.join(targetDir, 'src', pluralizeType(type), name + getFileExtension(type));
      const templateFile = path.join(templatesDir, pluralizeType(type), name + getFileExtension(type));
      
      // Check if source file exists
      if (!(await fs.pathExists(sourceFile))) {
        console.error(`❌ Source file not found: ${sourceFile}`);
        process.exit(1);
      }
      
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
    } catch (error) {
      console.error('❌ Error pushing template:', error.message);
      process.exit(1);
    }
  });

program
  .name('ampackage')
  .description('CLI tool for managing components, hooks, and utils')
  .version('1.0.0');

program.parse();