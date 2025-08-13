# ampackage

A CLI tool for managing components, hooks, and utils similar to shadcn/ui. This tool allows you to easily add templates from a central repository to your projects and push updates back to the template library.

## Features

- **Add templates**: Copy components, hooks, and utils from templates to your project
- **Push updates**: Send modified files back to the template library
- **List templates**: View all available templates
- **Multiple file support**: Add multiple files of the same type in one command
- **Custom destinations**: Specify where files should be copied
- **Overwrite protection**: Confirmation prompts for existing files
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

## Usage

### List Available Templates

```bash
ampackage list
```

### Add Templates to Your Project

```bash
# Add a single component
ampackage add component Button

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

### Push Files to Template Library

```bash
# Push a component back to templates
ampackage push component Button

# Push with overwrite (no confirmation)
ampackage push component Button --overwrite
```

## File Structure

### CLI Repository Structure
```
ampackage/
├── bin/
│   └── index.js          # CLI entry point
├── templates/
│   ├── components/
│   │   ├── Button.tsx
│   │   └── Modal.tsx
│   ├── hooks/
│   │   └── useAuth.ts
│   └── utils/
│       └── formatDate.ts
├── package.json
└── README.md
```

### Target Project Structure (after adding templates)
```
your-project/
├── src/                  # Default destination
│   ├── components/
│   │   ├── Button.tsx
│   │   └── Modal.tsx
│   ├── hooks/
│   │   └── useAuth.ts
│   └── utils/
│       └── formatDate.ts
└── package.json
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

### `ampackage list`
Lists all available templates organized by type.

### `ampackage add <type> <names...> [options]`
Adds one or more templates to your project.

**Arguments:**
- `type`: Type of template (`component`, `hook`, `util`)
- `names`: One or more template names to add

**Options:**
- `--dest <path>`: Custom destination directory (default: `src`)
- `--overwrite`: Overwrite existing files without confirmation

**Examples:**
```bash
ampackage add component Button
ampackage add component Button Modal --dest lib
ampackage add hook useAuth --overwrite
```

### `ampackage push <type> <name> [options]`
Pushes a file from your project back to the template library.

**Arguments:**
- `type`: Type of template (`component`, `hook`, `util`)
- `name`: Template name to push

**Options:**
- `--overwrite`: Overwrite existing template without confirmation

**Examples:**
```bash
ampackage push component Button
ampackage push hook useAuth --overwrite
```

## Development

### Adding New Templates

1. Create the template file in the appropriate directory:
   - Components: `templates/components/YourComponent.tsx`
   - Hooks: `templates/hooks/yourHook.ts`
   - Utils: `templates/utils/yourUtil.ts`

2. Test the template:
   ```bash
   ampackage list
   ampackage add component YourComponent
   ```

### Testing Locally

```bash
# Link the CLI for local testing
npm link

# Test in a sample project
mkdir test-project && cd test-project
ampackage add component Button
```

### Publishing to npm

```bash
# Update version in package.json
npm version patch  # or minor/major

# Publish to npm
npm publish
```

## Future Enhancements

- Remote template fetching from GitHub repositories
- Template versioning and updates
- Configuration file support
- Custom template sources
- Template dependencies and automatic installation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add your templates or improvements
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.