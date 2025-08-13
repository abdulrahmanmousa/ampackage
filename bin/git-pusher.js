import { simpleGit } from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// Helper function to get file extension based on type
function getFileExtension(type) {
  return type === 'component' ? '.tsx' : '.ts';
}

// Helper function to pluralize type
function pluralizeType(type) {
  return type + 's';
}

export class GitPusher {
  constructor(source) {
    this.source = source;
    this.repoDir = path.join(os.homedir(), '.ampackage', 'repos', source.name);
  }

  async ensureRepo() {
    const git = simpleGit();
    
    if (await fs.pathExists(this.repoDir)) {
      // Repo exists, update it
      const repoGit = simpleGit(this.repoDir);
      await repoGit.fetch();
      await repoGit.pull();
    } else {
      // Clone the repo
      await fs.ensureDir(path.dirname(this.repoDir));
      await git.clone(this.source.url, this.repoDir);
    }
    
    return simpleGit(this.repoDir);
  }

  async pushTemplate(type, name, content, commitMessage) {
    try {
      const git = await this.ensureRepo();
      
      // Create the file path
      const basePath = this.source.path || 'templates';
      const filePath = path.join(this.repoDir, basePath, pluralizeType(type), name + getFileExtension(type));
      
      // Ensure directory exists
      await fs.ensureDir(path.dirname(filePath));
      
      // Write the file
      await fs.writeFile(filePath, content, 'utf8');
      
      // Git operations
      await git.add(filePath);
      
      // Check if there are changes to commit
      const status = await git.status();
      if (status.files.length === 0) {
        console.log('ℹ️  No changes to commit');
        return false;
      }
      
      // Commit and push
      const message = commitMessage || `Update ${type}: ${name}`;
      await git.commit(message);
      
      const branch = this.source.branch || 'main';
      await git.push('origin', branch);
      
      return true;
    } catch (error) {
      throw new Error(`Failed to push to Git repository: ${error.message}`);
    }
  }

  async createPullRequest(type, name, content, title, description) {
    try {
      const git = await this.ensureRepo();
      
      // Create a new branch
      const branchName = `add-${type}-${name}-${Date.now()}`;
      await git.checkoutLocalBranch(branchName);
      
      // Create the file path
      const basePath = this.source.path || 'templates';
      const filePath = path.join(this.repoDir, basePath, pluralizeType(type), name + getFileExtension(type));
      
      // Ensure directory exists
      await fs.ensureDir(path.dirname(filePath));
      
      // Write the file
      await fs.writeFile(filePath, content, 'utf8');
      
      // Git operations
      await git.add(filePath);
      
      // Check if there are changes to commit
      const status = await git.status();
      if (status.files.length === 0) {
        console.log('ℹ️  No changes to commit');
        return false;
      }
      
      // Commit and push
      const message = title || `Add ${type}: ${name}`;
      await git.commit(message);
      await git.push('origin', branchName);
      
      console.log(`✅ Pushed to branch: ${branchName}`);
      console.log(`📝 Create a pull request manually at: ${this.source.url}/compare/${branchName}`);
      
      return { branch: branchName, url: `${this.source.url}/compare/${branchName}` };
    } catch (error) {
      throw new Error(`Failed to create pull request: ${error.message}`);
    }
  }
}

export async function pushToRemote(source, type, name, content, options = {}) {
  if (source.type !== 'github') {
    throw new Error(`Pushing to ${source.type} sources is not supported yet`);
  }
  
  const pusher = new GitPusher(source);
  
  if (options.createPR) {
    return await pusher.createPullRequest(type, name, content, options.title, options.description);
  } else {
    return await pusher.pushTemplate(type, name, content, options.commitMessage);
  }
}