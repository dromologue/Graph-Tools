# 🤖 Auto-Deploy Agent

An intelligent agent that watches your codebase for changes, asks for permission to commit, and automatically redeploys to Heroku.

## Features

- 👁️ **Smart File Watching**: Monitors key files and directories for changes
- 🤖 **Interactive Commits**: Asks for permission before committing changes  
- 📝 **Intelligent Commit Messages**: Generates meaningful commit messages based on changed files
- 🚀 **Automatic Heroku Deployment**: Pushes to Heroku after successful commits
- ⏱️ **Debounced Changes**: Groups rapid changes together to avoid spam commits
- 🛡️ **Safe Defaults**: Ignores node_modules, logs, and temporary files

## Quick Start

### 1. Install Dependencies
```bash
npm install chokidar
```

### 2. Configure Heroku (if not already done)
```bash
# Login to Heroku
heroku login

# Create or connect to Heroku app
heroku create your-app-name
# OR
heroku git:remote -a your-existing-app-name

# Set environment variable (optional)
export HEROKU_APP_NAME=your-app-name
```

### 3. Start the Agent
```bash
npm run watch
```

Or run directly:
```bash
node auto-deploy-agent.js
```

## How It Works

1. **🔍 Watches Files**: Monitors these paths for changes:
   - `server.js` - Main server file
   - `public/**/*` - Web interface files
   - `Files/**/*` - Enhanced visualizer files
   - `mcp-graph-server/**/*` - MCP server files
   - `package.json`, `Procfile`, `app.json` - Config files

2. **⏱️ Debounces Changes**: Waits 3 seconds after the last change to group related modifications

3. **🤖 Asks Permission**: Shows you what changed and asks if you want to commit and deploy

4. **📝 Smart Commits**: Generates appropriate commit messages like:
   - "Update UI and server functionality - 2025-01-15"
   - "Update user interface and visualizations - 2025-01-15"  
   - "Update MCP server functionality - 2025-01-15"

5. **🚀 Auto-Deploy**: Pushes to Heroku and shows the live app URL

## Example Session

```
🤖 Auto-Deploy Agent for Graph Tools
=====================================
👁️  Watching for changes...
⚡ Will ask for permission before committing
🚀 Will auto-deploy to Heroku after commits

✅ Auto-Deploy Agent is now active!
📝 Make changes to your code and I'll handle the rest...

📝 MODIFIED: Files/enhanced-graph-visualizer.html
📝 MODIFIED: server.js

🔄 Processing changes...
📊 2 file(s) changed in the last 3 seconds

📋 Git status:
 M Files/enhanced-graph-visualizer.html
 M server.js

🤖 Would you like me to commit these changes and deploy? (y/N): y

📦 Staging changes...
💬 Commit message: "Update UI and server functionality - 2025-01-15"
📝 Committing changes...
✅ Changes committed successfully

🚀 Deploying to Heroku...
✅ Deployment successful!
🌐 App URL: https://your-app-name.herokuapp.com/

🎉 Auto-deployment completed successfully!
```

## Configuration

The agent can be configured by editing the `config` object in `auto-deploy-agent.js`:

```javascript
this.config = {
    watchPaths: [
        'server.js',
        'public/**/*',
        'Files/**/*',
        // ... add more paths
    ],
    ignorePaths: [
        'node_modules/**',
        '.git/**',
        // ... add more ignore patterns
    ],
    debounceDelay: 3000, // milliseconds
    herokuApp: process.env.HEROKU_APP_NAME || null
};
```

## Environment Variables

- `HEROKU_APP_NAME`: Set your Heroku app name (optional, auto-detected if not set)

## Ignored Files

The agent automatically ignores:
- `node_modules/**` - Dependencies
- `.git/**` - Git metadata
- `uploads/**` - User uploaded files
- `mcp-graph-server/data/**` - Generated data files
- `**/*.log` - Log files
- `**/.DS_Store` - macOS system files
- `**/tmp/**` - Temporary files

## Safety Features

- ✅ **Permission Required**: Always asks before committing
- ✅ **Git Validation**: Checks if you're in a git repository
- ✅ **Heroku Validation**: Verifies Heroku CLI is available
- ✅ **Error Handling**: Graceful error handling with helpful messages
- ✅ **Graceful Shutdown**: Ctrl+C stops the agent cleanly

## Troubleshooting

### Agent won't start
- Ensure you're in the project root directory
- Check that git repository is initialized: `git status`
- Install dependencies: `npm install chokidar`

### Heroku deployment fails
- Check Heroku authentication: `heroku auth:whoami` 
- Verify app exists: `heroku apps:info`
- Check logs: `heroku logs --tail`

### Changes not detected
- Verify files are in watched paths
- Check if files are in ignore patterns
- Look for console messages about detected changes

## Manual Operations

You can still use normal git and Heroku commands:

```bash
# Manual deployment
npm run deploy

# View Heroku logs
heroku logs --tail

# Check app status
heroku ps

# Open app in browser
heroku open
```

## Integration with Existing Workflow

The auto-deploy agent works alongside your existing development workflow:

- ✅ Compatible with manual git commits
- ✅ Works with existing Heroku setup
- ✅ Doesn't interfere with normal development
- ✅ Can be stopped and started as needed

## Tips for Best Results

1. **Use descriptive file names** - The agent generates commit messages based on changed files
2. **Group related changes** - Make changes in batches for better commit messages
3. **Test locally first** - Ensure your changes work before letting the agent deploy
4. **Monitor deployments** - Check the Heroku app URL after deployment to verify everything works

---

**Happy coding! 🚀 The agent will handle the deployment pipeline so you can focus on building amazing graph tools.**