# ampackage

A CLI tool for managing components, hooks, and utils similar to shadcn/ui. This tool allows you to easily add templates from both local and remote sources to your projects, and contribute back to template libraries.

## Features

- **Multi-source support**: Add templates from local directories, GitHub repositories, and npm packages
- **Remote fetching**: Download templates from GitHub repositories with caching
- **Source management**: Configure and manage multiple template sources
- **Add templates**: Copy components, hooks, and utils from any configured source to your project
- **Push updates**: Send modified files back to template libraries (local and remote)
- **List templates**: View all available templates from all sources
- **Multiple file support**: Add multiple files of the same type in one command
- **Custom destinations**: Specify where files should be copied
- **Overwrite protection**: Confirmation prompts for existing files
- **Git integration**: Push to remote repositories with PR support
- **Caching**: Intelligent caching for remote templates
- **Cross-platform**: Works on Windows, macOS, and Linux

## Installation

### Global Installation (Recommended)

```bash
npm install -g ampackage
```

### Local Development

```bash
# Clone the repository
git clone https://github.com/abdulrahmanmousa/ampackage.git
cd ampackage

# Install dependencies
npm install

# Link for local testing
npm link
```

## Quick Start

```bash
# List available templates from all sources
ampackage list

# Add a GitHub source for community templates
ampackage source add community github https://github.com/your-org/templates.git

# Install a component from any source
ampackage add component Button

# Create and push a new component
ampackage push component MyComponent --source community --pr
```

## Usage

### Source Management

#### Add Template Sources

```bash
# Add a GitHub repository as a source
ampackage source add my-company github https://github.com/my-company/ui-templates.git

# Add with custom branch and path
ampackage source add design-system github https://github.com/org/design-system.git --branch develop --path src/templates

# Add a local directory
ampackage source add local-dev local ./my-templates
```

#### List Sources

```bash
ampackage source list
```

#### Remove Sources

```bash
ampackage source remove my-company
```

### Working with Templates

#### List Available Templates

```bash
# List from all sources
ampackage list

# List from specific source only
ampackage list --source my-company
```

#### Add Templates to Your Project

```bash
# Add from any available source (searches all)
ampackage add component Button

# Add from specific source
ampackage add component Button --source my-company

# Add multiple components
ampackage add component Button Modal Card

# Add a hook
ampackage add hook useAuth

# Add a utility
ampackage add util formatDate

# Custom destination (default is 'src')
ampackage add component Button --dest lib

# Overwrite existing files without confirmation
ampackage add component Button --overwrite
```

#### Push Templates to Sources

```bash
# Push to local source (default)
ampackage push component Button

# Push to specific source
ampackage push component Button --source my-company

# Create a pull request (for Git sources)
ampackage push component Button --source my-company --pr

# Push with custom commit message
ampackage push component Button --source my-company --message "Update Button component with new variants"

# Overwrite without confirmation
ampackage push component Button --overwrite
```

## Configuration

ampackage uses a configuration file (`.ampackage.json`) to manage sources. The file is automatically created in your home directory or current project directory.

### Configuration File Structure

```json
{
  "sources": [
    {
      "name": "local",
      "type": "local",
      "path": "./templates",
      "default": true
    },
    {
      "name": "community",
      "type": "github",
      "url": "https://github.com/community/ui-templates.git",
      "branch": "main",
      "path": "templates"
    }
  ],
  "cache": {
    "enabled": true,
    "ttl": 3600000
  }
}
```

### Source Types

#### Local Sources
```bash
ampackage source add my-local local ./path/to/templates
```

#### GitHub Sources
```bash
ampackage source add my-repo github https://github.com/user/repo.git --branch main --path templates
```

#### NPM Sources (Coming Soon)
```bash
ampackage source add my-package npm @company/ui-templates
```

## Available Templates

### Components
- **Button**: A flexible button component with variants and sizes
- **Modal**: A modal dialog component with backdrop and close functionality

### Hooks
- **useAuth**: Authentication hook with login/logout functionality

### Utils
- **formatDate**: Date formatting utilities with internationalization support

## Command Reference

### `ampackage source <command>`
Manage template sources.

#### `ampackage source add <name> <type> <url> [options]`
Add a new template source.

**Arguments:**
- `name`: Unique name for the source
- `type`: Source type (`github`, `npm`, `local`)
- `url`: Source URL or path

**Options:**
- `--branch <branch>`: Git branch (for GitHub sources, default: `main`)
- `--path <path>`: Base path within source (default: `templates`)
- `--default`: Set as default source

#### `ampackage source remove <name>`
Remove a template source.

#### `ampackage source list`
List all configured sources.

### `ampackage list [options]`
List all available templates from configured sources.

**Options:**
- `--source <name>`: List templates from specific source only

### `ampackage add <type> <names...> [options]`
Add one or more templates to your project.

**Arguments:**
- `type`: Type of template (`component`, `hook`, `util`)
- `names`: One or more template names to add

**Options:**
- `--dest <path>`: Custom destination directory (default: `src`)
- `--source <name>`: Fetch from specific source only
- `--overwrite`: Overwrite existing files without confirmation

### `ampackage push <type> <name> [options]`
Push a file from your project back to a template source.

**Arguments:**
- `type`: Type of template (`component`, `hook`, `util`)
- `name`: Template name to push

**Options:**
- `--source <name>`: Push to specific source (default: local)
- `--pr`: Create a pull request instead of direct push (for Git sources)
- `--message <msg>`: Commit message for Git sources
- `--overwrite`: Overwrite existing template without confirmation

## Development

### Setting Up for Development

```bash
# Clone and setup
git clone https://github.com/abdulrahmanmousa/ampackage.git
cd ampackage
npm install
npm link

# Test in a sample project
mkdir test-project && cd test-project
ampackage source add community github https://github.com/user/templates.git
ampackage add component Button
```

### Creating Template Sources

#### For Organizations
1. Create a repository with the following structure:
```
your-templates/
├── templates/
│   ├── components/
│   │   ├── Button.tsx
│   │   └── Modal.tsx
│   ├── hooks/
│   │   └── useAuth.ts
│   └── utils/
│       └── helpers.ts
└── README.md
```

2. Make it available to your team:
```bash
ampackage source add company github https://github.com/your-org/templates.git
```

#### For Open Source
1. Fork this repository or create your own template collection
2. Share the source configuration:
```bash
ampackage source add awesome-ui github https://github.com/community/awesome-ui.git
```

### Adding New Templates to This Repository

1. Create the template file in the appropriate directory:
   - Components: `templates/components/YourComponent.tsx`
   - Hooks: `templates/hooks/yourHook.ts`
   - Utils: `templates/utils/yourUtil.ts`

2. Test the template:
   ```bash
   ampackage list
   ampackage add component YourComponent
   ```

3. Submit a pull request

### Publishing to npm

```bash
# Update version in package.json
npm version patch  # or minor/major

# Publish to npm
npm publish
```

## Future Enhancements

- ✅ Remote template fetching from GitHub repositories
- ✅ Source management and configuration
- ✅ Git-based pushing with PR support
- 🔄 NPM package sources
- 🔄 Template versioning and updates
- 🔄 Authentication for private repositories
- 🔄 Template dependencies and automatic installation
- 🔄 Interactive template selection
- 🔄 Template search and filtering
- 🔄 Workspace-level configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add your templates or improvements
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.