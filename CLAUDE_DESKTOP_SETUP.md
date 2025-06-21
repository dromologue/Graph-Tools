# Claude Desktop MCP Server Setup

## Quick Setup Guide

### 1. Find Your Claude Desktop Config File

**macOS:**
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```bash
%APPDATA%\Claude\claude_desktop_config.json
```

### 2. Add This Configuration

Replace the entire contents of your `claude_desktop_config.json` file with:

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

**Important:** Update the path `/Users/dromologue/code/Graph-Tools/mcp-graph-server/index.js` to match your actual installation directory.

### 3. Restart Claude Desktop

After saving the config file, completely quit and restart Claude Desktop.

### 4. Test the Integration

In Claude Desktop, try this prompt:

```
Analyze these relationships and create a graph visualization:

[
  {"id": "Alice", "friends": ["Bob", "Carol"]},
  {"id": "Bob", "friends": ["Alice", "David"]},
  {"id": "Carol", "friends": ["Alice"]},
  {"id": "David", "friends": ["Bob"]}
]

Use the fields "id" and "friends" to determine relationships.
```

## Troubleshooting

### Server Not Loading
1. Check the file path in your config is correct
2. Ensure Node.js is installed: `node --version`
3. Check permissions: `chmod +x index.js`
4. Test manually: `node index.js` (should show "Graph Relationship MCP Server running on stdio")

### Dependencies Missing
```bash
cd /Users/dromologue/code/Graph-Tools/mcp-graph-server
npm install
```

### Ruby CLI Issues
```bash
ruby --version  # Should be Ruby 2.7+
ruby ../graph_cli.rb --help  # Should show usage
```

### Claude Desktop Logs
- Check Claude Desktop console/logs for error messages
- Look for MCP server connection errors

## Features Available

Once connected, you can:
- **analyze_relationships**: Convert data into graph relationships and create interactive visualizations
- **create_adjacency_matrix**: Generate adjacency matrices and enhanced D3.js visualizations

The generated HTML files include:
- Interactive force-directed graph layout
- DFS/BFS/Neighbors operations with visual highlighting  
- Real-time algorithm results
- Adjacency matrix export functionality
- Drag and drop nodes with canvas constraints