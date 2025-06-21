# Graph Tools - Interactive Graph Analysis Toolkit

A comprehensive Ruby-based graph analysis toolkit with web visualizations and Claude Desktop MCP integration for AI-powered graph analysis.

## 🚀 Features

### Core Graph Operations
- **Adjacency Matrix Support** - Load from CSV, JSON, or TXT files
- **Graph Algorithms** - DFS, BFS, neighbor finding with visual feedback
- **Multiple Export Formats** - CSV matrices, JSON, interactive HTML
- **Command Line Interface** - Full-featured CLI for batch operations

### Interactive Visualizations
- **Enhanced Graph Visualizer** - D3.js force-directed layouts with real-time interactions
- **Algorithm Visualization** - Visual highlighting for DFS/BFS traversals
- **Interactive Editing** - Add/remove nodes and edges with drag-and-drop
- **Matrix Export** - Custom filename support for adjacency matrix downloads
- **Graph Statistics** - Real-time node count, edge count, and density calculations

### AI Integration
- **Claude Desktop MCP Server** - Analyze relationship data using natural language
- **Automatic Visualization** - Generate interactive graphs from structured data
- **Smart Data Processing** - Extract relationships from various data formats

## 📦 Installation

### Prerequisites
- **Ruby 2.7+** - Core graph operations
- **Node.js 16+** - MCP server functionality
- **Modern web browser** - For interactive visualizations

### Setup
```bash
git clone https://github.com/yourusername/Graph-Tools.git
cd Graph-Tools

# For local CLI usage
# Install MCP server dependencies
cd mcp-graph-server
npm install
cd ..

# For web application
npm install
```

### 🌐 Web Application
Deploy to Heroku for a full web interface:

```bash
# Quick deploy to Heroku
heroku create your-graph-tools-app
heroku buildpacks:add heroku/ruby
heroku buildpacks:add heroku/nodejs
git push heroku main
heroku open
```

See [HEROKU_DEPLOY.md](HEROKU_DEPLOY.md) for detailed deployment instructions.

## 🔧 Usage

### Command Line Interface

```bash
# Basic graph visualization
ruby graph_cli.rb matrix.csv

# With custom vertex labels
ruby graph_cli.rb -v "A,B,C,D" matrix.csv

# Run graph algorithms
ruby graph_cli.rb --dfs A --bfs B matrix.csv

# Export to web visualization
ruby graph_cli.rb -d matrix.csv

# Export to JSON
ruby graph_cli.rb -j output.json matrix.csv
```

### Interactive Visualizer

**Local Usage:**
1. Open `Files/enhanced-graph-visualizer.html` in your browser
2. Load sample data or create your own graph
3. Run DFS/BFS operations with visual highlighting
4. Export matrices with custom filenames

**Web Application:**
1. Run `npm start` and visit `http://localhost:3000`
2. Upload matrix files via drag-and-drop
3. Try sample data for quick testing
4. Get real-time analysis results

### Claude Desktop Integration

1. **Configure Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "graph-relationship-server": {
      "command": "node",
      "args": ["/path/to/Graph-Tools/mcp-graph-server/index.js"]
    }
  }
}
```

2. **Use natural language** in Claude Desktop:
```
Analyze these relationships and create a graph visualization:
[
  {"id": "Alice", "friends": ["Bob", "Carol"]},
  {"id": "Bob", "friends": ["Alice", "David"]},
  {"id": "Carol", "friends": ["Alice"]},
  {"id": "David", "friends": ["Bob"]}
]
```

## 📁 Project Structure

```
Graph-Tools/
├── graph.rb                           # Core Graph class
├── graph_cli.rb                       # Command line interface
├── Files/                             # Visualization files directory
│   ├── enhanced-graph-visualizer.html # Interactive D3.js visualizer with DFS/BFS
│   ├── graph-visualizer.html          # Basic web visualizer
│   └── *.json                         # Generated graph data files
├── sample_matrix.*                    # Sample data files
├── test_*.rb                          # Test suites
├── run_all_tests.rb                   # Comprehensive test runner
├── CLAUDE_DESKTOP_SETUP.md            # MCP server setup guide
└── mcp-graph-server/                  # Claude Desktop MCP server
    ├── index.js                       # MCP server implementation
    ├── package.json                   # Node.js dependencies
    ├── test-connection.js             # Connection testing
    └── data/                          # MCP server working files
```

## Quick Start

### 1. Create a Graph Visually

```bash
# Open the Enhanced Graph Visualizer (RECOMMENDED)
open "Graph-Tools/Files/enhanced-graph-visualizer.html"
```

**In the enhanced visualizer:**
- Add vertices by typing names and clicking "Add Node" 
- Click two nodes to select them, then click "Add Edge"
- Drag nodes to reposition them (stays within canvas bounds)
- Run DFS/BFS operations and see visual highlights
- Export as CSV matrix when done

### 2. Analyze Your Graph

```bash
cd "Graph-Tools"

# Basic analysis
ruby graph_cli.rb your_graph.csv

# With custom vertex names  
ruby graph_cli.rb -v "Alice,Bob,Carol,David" your_graph.csv

# Specific operations
ruby graph_cli.rb -v "Alice,Bob,Carol,David" --dfs Alice your_graph.csv
ruby graph_cli.rb -v "Alice,Bob,Carol,David" --bfs Bob your_graph.csv
ruby graph_cli.rb -v "Alice,Bob,Carol,David" --neighbors Carol your_graph.csv
```

### 3. Export for Visualization

```bash
# Export for D3.js editor (interactive)
ruby graph_cli.rb -v "Alice,Bob,Carol,David" -d your_graph.csv

# Export for web editor (React-based)
ruby graph_cli.rb -v "Alice,Bob,Carol,David" -w your_graph.csv
```

## Command Reference

### CLI Options

```bash
ruby graph_cli.rb [options] matrix_file

Options:
  -v, --vertices LABELS    # Comma-separated vertex labels
  -f, --format FORMAT      # Output format (text, matrix, json)
  -j, --export-json FILE   # Export to JSON file
  -w, --web               # Export for web visualization
  -d, --d3                # Export for D3.js visualization
  --dfs VERTEX            # Perform DFS traversal
  --bfs VERTEX            # Perform BFS traversal  
  --neighbors VERTEX      # Show neighbors
  --path FROM,TO          # Check edge existence
```

### Supported File Formats

- **CSV**: `0,1,0\n1,0,1\n0,1,0`
- **TXT**: `0 1 0\n1 0 1\n0 1 0` (space-separated)
- **JSON**: `{"matrix": [[0,1,0],[1,0,1],[0,1,0]]}`

### Examples

```bash
# Analyze sample data
ruby graph_cli.rb sample_matrix.csv

# Social network analysis
ruby graph_cli.rb -v "Alice,Bob,Carol,David" \
  --dfs Alice \
  --bfs Bob \
  --neighbors Carol \
  social_network.csv

# Export and visualize
ruby graph_cli.rb -v "Team1,Team2,Team3" -d project_dependencies.csv
```

## Testing

```bash
cd "Graph-Tools"

# Run all tests
ruby run_all_tests.rb

# Run specific test suites
ruby test_graph.rb      # Core graph functionality
ruby test_cli.rb        # CLI operations  
ruby test_integration.rb # End-to-end workflows
```

## MCP Server (Claude Integration)

The MCP server enables Claude to analyze relationship data and create graphs.

### Setup

1. **Install dependencies:**
   ```bash
   cd "Graph-Tools/mcp-graph-server"
   npm install
   ```

2. **Configure Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
   ```json
   {
     "mcpServers": {
       "graph-relationships": {
         "command": "node",
         "args": ["/Users/your-username/code/Graph-Tools/mcp-graph-server/index.js"],
         "env": {}
       }
     }
   }
   ```

3. **Restart Claude Desktop**

### MCP Tools Available

- `analyze_relationships` - Extract relationships from structured data
- `create_adjacency_matrix` - Build matrices from relationships  
- `graph_operations` - Perform DFS/BFS/analysis
- `export_graph_d3` - Export for D3.js visualization

## Visualizers

### 🚀 Enhanced Graph Visualizer (`enhanced-graph-visualizer.html`) - **RECOMMENDED**
- **Best for:** Complete graph analysis workflow
- **Features:** 
  - Interactive graph creation and editing
  - Built-in DFS/BFS/Neighbors operations
  - Real-time visual highlighting of algorithm results
  - Live statistics and operation results panel
  - Canvas-constrained nodes for better UX
- **Use case:** Primary tool for all graph operations and analysis
- **MCP Integration:** This is the visualizer generated by Claude Desktop

### D3.js Force Layout (`graph-d3-visualizer.html`) - *Legacy*
- **Status:** ⚠️ Deprecated - Use Enhanced Visualizer instead
- **Features:** Basic drag nodes, add/remove elements
- **Use case:** Legacy compatibility only

### React Editor (`graph-editor.html`) - *Legacy*
- **Status:** ⚠️ Deprecated - Use Enhanced Visualizer instead  
- **Features:** Form-based node/edge creation, matrix view
- **Use case:** Legacy compatibility only

### Basic Visualizer (`graph-visualizer.html`) - *Legacy*
- **Status:** ⚠️ Deprecated - Use Enhanced Visualizer instead
- **Features:** Simple JSON data loading
- **Use case:** Legacy compatibility only

## Workflow Examples

### 1. Social Network Analysis
```bash
# Create network in Enhanced Visualizer (RECOMMENDED)
open "Graph-Tools/enhanced-graph-visualizer.html"
# → Add people as nodes, friendships as edges
# → Run DFS/BFS to analyze connections
# → Export as social_network.csv

# Analyze the network
ruby graph_cli.rb -v "Alice,Bob,Carol,David,Eve" \
  --dfs Alice \
  --bfs Bob \
  social_network.csv

# Find central nodes and communities
ruby graph_cli.rb -v "Alice,Bob,Carol,David,Eve" \
  --neighbors Alice \
  --neighbors Bob \
  social_network.csv
```

### 2. Project Dependencies
```bash
# Create dependency graph
ruby graph_cli.rb -v "auth,api,models,frontend,database,utils" \
  dependencies.csv

# Check for circular dependencies (DFS)
ruby graph_cli.rb -v "auth,api,models,frontend,database,utils" \
  --dfs auth \
  dependencies.csv

# Visualize the dependency tree
ruby graph_cli.rb -v "auth,api,models,frontend,database,utils" \
  -d dependencies.csv
```

### 3. Using with Claude (MCP)
1. **Provide relationship data to Claude**
2. **Ask:** "Analyze this organizational structure for reporting chains"
3. **Claude uses MCP tools** to create adjacency matrix and perform analysis
4. **Export results** to D3.js for interactive exploration

## Performance

- **Graph creation:** Sub-second for graphs up to 100 nodes
- **DFS/BFS:** Linear time complexity O(V + E)
- **Visualization:** Handles 50+ nodes smoothly in D3.js
- **File formats:** All formats (CSV, JSON, TXT) supported efficiently

## Error Handling

The tools provide comprehensive error handling for:
- Invalid matrix formats
- Non-existent vertices in operations  
- Malformed input files
- Missing dependencies

Run tests to verify all error conditions are handled properly.

## Contributing

The codebase includes comprehensive tests covering:
- Core graph operations (27 tests)
- CLI functionality (21 tests)  
- Integration workflows (6 tests)
- MCP server tools (9 tests)

Run `ruby run_all_tests.rb` before making changes.