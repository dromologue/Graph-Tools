# Claude Desktop + Heroku Deployment Guide

## Understanding the Two Components

### 🌐 **Heroku Web App** 
- **Purpose**: Public web interface for graph analysis
- **URL**: `https://your-app-name.herokuapp.com`
- **Users**: Anyone with the link can use the tool
- **Features**: Full enhanced visualizer with tool palette

### 🖥️ **Claude Desktop MCP Server**
- **Purpose**: Local integration with Claude Desktop
- **Runs**: On your local machine 
- **Users**: Only you (in Claude Desktop conversations)
- **Features**: Natural language graph analysis commands

## Option 1: Keep MCP Server Local (Recommended)

Your current MCP server works great locally. Keep using it with Claude Desktop:

### Claude Desktop Config (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "graph-relationship-server": {
      "command": "node",
      "args": ["/Users/dromologue/code/Graph-Tools/mcp-graph-server/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**Benefits:**
- ✅ Works in Claude Desktop conversations
- ✅ Local file access and processing
- ✅ No internet dependency for Claude integration
- ✅ Full MCP server capabilities

### How to Use Both:
1. **Claude Desktop**: Use MCP commands for quick analysis
2. **Heroku App**: Share the web interface with others
3. **Local Development**: Use the enhanced visualizer locally

## Option 2: Reference Heroku App in MCP (Advanced)

If you want Claude to reference your Heroku deployment, update the MCP server to include the URL:

### Modified MCP Server Code
Add this to your `mcp-graph-server/index.js`:

```javascript
// Add Heroku app URL as environment variable
const HEROKU_APP_URL = process.env.HEROKU_APP_URL || 'https://your-app-name.herokuapp.com';

// Include URL in generated visualizations
function generateVisualizationHTML(graphData, title) {
  // ... existing code ...
  
  const htmlContent = `
    <!-- Your visualization HTML -->
    <p>🌐 <strong>Live Web Version:</strong> 
       <a href="${HEROKU_APP_URL}" target="_blank">Open in Heroku App</a>
    </p>
    <!-- Rest of visualization -->
  `;
  
  return htmlContent;
}
```

### Update Claude Desktop Config:
```json
{
  "mcpServers": {
    "graph-relationship-server": {
      "command": "node",
      "args": ["/Users/dromologue/code/Graph-Tools/mcp-graph-server/index.js"],
      "env": {
        "NODE_ENV": "production",
        "HEROKU_APP_URL": "https://your-app-name.herokuapp.com"
      }
    }
  }
}
```

## Recommended Workflow

### 1. Deploy to Heroku First
```bash
# Your deployment commands
heroku create your-graph-visualizer
git push heroku main
heroku open
```

### 2. Update MCP Environment (Optional)
```json
{
  "mcpServers": {
    "graph-relationship-server": {
      "command": "node",
      "args": ["/Users/dromologue/code/Graph-Tools/mcp-graph-server/index.js"],
      "env": {
        "NODE_ENV": "production",
        "HEROKU_APP_URL": "https://YOUR-ACTUAL-HEROKU-URL.herokuapp.com"
      }
    }
  }
}
```

### 3. Test Both Integrations
- **Claude Desktop**: Ask Claude to analyze relationships
- **Heroku Web**: Share URL with colleagues
- **Local Enhanced**: Use the full tool palette locally

## Best Practice

**Keep both running:**
- **MCP Server**: Local Claude Desktop integration  
- **Heroku App**: Public web access
- **Local Dev**: Enhanced features and development

This gives you maximum flexibility and functionality!

---

🎯 **Replace `your-app-name` with your actual Heroku app name after deployment**