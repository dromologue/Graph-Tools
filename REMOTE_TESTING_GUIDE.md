# 🧪 Remote MCP Server Testing Guide

Test your deployed Graph Tools app to ensure all features work correctly on your domain and verify MCP server functionality.

## Quick Start

### Option 1: Interactive Testing (Recommended)
```bash
npm run test-heroku
```

### Option 2: Direct URL Testing (Default: mcp.dromologue.com)
```bash
# Test default domain
npm run test-remote

# Test custom domain
node test-remote-mcp.js http://mcp.dromologue.com
```

### Option 3: Environment Variable
```bash
HEROKU_APP_URL=http://mcp.dromologue.com npm run test-remote
```

## What Gets Tested

### 🔌 Server Connectivity
- ✅ Basic HTTP connectivity to Heroku app
- ✅ Correct application deployment verification
- ✅ Response time and availability

### 🔗 API Endpoints
- ✅ `/api/info` - Server information and features
- ✅ `/api/latest-graph` - Graph data retrieval
- ✅ `/api/sample` - Sample data generation
- ✅ Error handling and response formats

### 📊 Sample Data Analysis
- ✅ Social network sample generation
- ✅ Dependency graph sample creation
- ✅ Basic graph sample functionality
- ✅ Graph data structure validation

### 🧠 Centrality Analysis Simulation
- ✅ Graph data structure validation
- ✅ Degree centrality calculation logic
- ✅ Relationship processing algorithms
- ✅ MCP server logic verification

### 🎨 Enhanced Visualizer
- ✅ Visualizer accessibility at `/visualizer`
- ✅ Text-based UI implementation (no icons)
- ✅ Centrality analysis features present
- ✅ Auto-loading functionality
- ✅ Two-column layout implementation

## Test Results Interpretation

### 🎉 All Tests Pass (Score: 15+/15)
Your app is fully operational and ready for:
- ✅ Production use
- ✅ Claude Desktop MCP integration
- ✅ Public sharing and collaboration
- ✅ Advanced graph analysis workflows

### ⚠️ Some Tests Fail (Score: 10-14/15)
Minor issues detected:
- Check Heroku logs: `heroku logs --tail`
- Verify latest deployment: `git push heroku main`
- Test specific endpoints manually

### ❌ Many Tests Fail (Score: <10/15)
Major issues require attention:
- Verify Heroku app URL is correct
- Check if app is properly deployed
- Review Heroku configuration
- Ensure all dependencies are installed

## Manual Testing Checklist

After automated tests, manually verify:

### Main Page (`http://mcp.dromologue.com/`)
- [ ] Page loads without errors
- [ ] Clean UI without emoji icons
- [ ] "Interactive Graph Visualizer" button present
- [ ] Sample buttons work (Social Network, Dependency Graph, Basic Graph)
- [ ] File upload functionality works

### Enhanced Visualizer (`http://mcp.dromologue.com/visualizer`)
- [ ] Visualizer loads with clean interface
- [ ] Text-based buttons (no emoji icons)
- [ ] Two-column tool palette layout
- [ ] Add nodes functionality works
- [ ] DFS/BFS operations work
- [ ] Centrality analysis buttons work (Degree, Between, Close, Eigen)
- [ ] Start node dropdown populates correctly
- [ ] Auto-loading of graph data works

### API Endpoints
- [ ] `/api/info` returns server information
- [ ] `/api/sample` generates sample graphs
- [ ] `/api/latest-graph` returns graph data
- [ ] Error responses are handled gracefully

## Troubleshooting

### "Connection refused" errors
```bash
# Check if app is running
heroku ps

# Check app logs
heroku logs --tail

# Restart app if needed
heroku restart
```

### "App not found" errors
```bash
# Verify Heroku app exists
heroku apps:info

# Check git remote
git remote -v

# Add Heroku remote if missing
heroku git:remote -a your-app-name
```

### API endpoints not working
```bash
# Check recent deployments
heroku releases

# Verify build succeeded
heroku logs --tail

# Check app configuration
heroku config
```

### Visualizer not loading
- Verify files are deployed: check `/files/enhanced-graph-visualizer.html`
- Check for JavaScript errors in browser console
- Ensure server.js has correct routes

## Advanced Testing

### Test with Custom Data
```javascript
// Test custom graph data
const customGraph = {
    relationships: [
        { from: "Node1", to: "Node2", weight: 1 },
        { from: "Node2", to: "Node3", weight: 1 }
    ],
    vertices: ["Node1", "Node2", "Node3"]
};

// POST to /api/analyze with multipart/form-data
```

### Performance Testing
```bash
# Test response times
curl -w "%{time_total}" http://mcp.dromologue.com/

# Test concurrent requests
ab -n 100 -c 10 http://mcp.dromologue.com/
```

### Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Create test configuration
artillery quick --count 10 --num 5 http://mcp.dromologue.com/
```

## Integration with Claude Desktop

Once remote testing passes, your app is ready for MCP integration:

1. **Local MCP Server**: Use local server pointing to remote data
2. **Remote API Integration**: Configure Claude to use Heroku endpoints
3. **Hybrid Setup**: Local MCP with remote visualization URLs

### MCP Server Configuration
```json
{
  "mcpServers": {
    "graph-tools-remote": {
      "command": "node",
      "args": ["/path/to/mcp-server/index.js"],
      "env": {
        "REMOTE_APP_URL": "http://mcp.dromologue.com"
      }
    }
  }
}
```

## Success Metrics

Your remote MCP server is working correctly when:
- ✅ All automated tests pass
- ✅ Manual testing checklist completed
- ✅ Sample data generates and visualizes correctly
- ✅ Centrality analysis features work
- ✅ UI improvements are active (text buttons, two-column layout)
- ✅ Auto-loading functionality works
- ✅ API endpoints respond correctly
- ✅ No JavaScript errors in browser console

---

🎯 **Goal**: Verify your Graph Tools app is production-ready and all MCP server functionality works correctly in the deployed environment.