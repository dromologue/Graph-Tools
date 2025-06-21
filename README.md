# Graph Tools - Interactive Graph Analysis Toolkit

A comprehensive Ruby-based graph analysis toolkit with web visualizations and MCP server for AI-powered graph analysis.

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
- **MCP Server** - HTTP REST API and Claude Desktop MCP server
- **Automatic Visualization** - Generate interactive graphs from structured data
- **Smart Data Processing** - Extract relationships from various data formats
- **Centrality Analysis** - Calculate degree, betweenness, closeness, eigenvector centrality

## 📦 Installation

### Prerequisites
- **Ruby 2.7+** - Core graph operations
- **Node.js 16+** - MCP server functionality
- **Modern web browser** - For interactive visualizations

### Setup
```bash
git clone https://github.com/dromologue/Graph-Tools.git
cd Graph-Tools

# For local CLI usage
gem install

# Install MCP server dependencies
cd mcp-graph-server
npm install
cd ..

# For web application
npm install
```

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

### MCP Server Integration

#### HTTP REST API Mode
```bash
cd mcp-graph-server
npm run api
# Server runs on http://localhost:3001
```

#### Claude Desktop Mode
1. **Configure Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "graph-server": {
      "command": "node",
      "args": ["/path/to/Graph-Tools/mcp-graph-server/api-server.js"],
      "env": {
        "SERVER_MODE": "mcp"
      }
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
├── server.js                          # Web application server
├── Files/                             # Visualization files directory
│   └── enhanced-graph-visualizer.html # Interactive D3.js visualizer
├── public/                            # Web application files
│   ├── index.html                     # Main web interface
│   └── mcp-documentation.html         # API documentation
├── mcp-graph-server/                  # MCP server
│   ├── api-server.js                  # Dual-mode MCP/HTTP server
│   ├── index.js                       # Original MCP server
│   ├── package.json                   # Node.js dependencies
│   ├── claude-config-example.json     # Claude Desktop config example
│   └── data/                          # Generated files (matrices, visualizations)
├── Gemfile                            # Ruby dependencies
├── package.json                       # Node.js web server dependencies
└── README.md                          # This file
```

## API Endpoints

The MCP server provides both MCP protocol and HTTP REST API:

- `POST /api/analyze-relationships` - Extract relationships from data
- `POST /api/create-adjacency-matrix` - Build matrices from relationship pairs
- `POST /api/calculate-centrality` - Compute network centrality measures
- `POST /api/analyze-network-structure` - Comprehensive network analysis
- `GET /health` - Health check endpoint

See `/mcp-documentation.html` for complete API documentation with examples.

## Quick Start

### 1. Create a Graph Visually

```bash
# Open the Enhanced Graph Visualizer
open "Files/enhanced-graph-visualizer.html"
```

**In the enhanced visualizer:**
- Add vertices by typing names and clicking "Add Node" 
- Click two nodes to select them, then click "Add Edge"
- Drag nodes to reposition them
- Run DFS/BFS operations and see visual highlights
- Export as CSV matrix when done

### 2. Analyze Your Graph

```bash
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

# Export JSON for programmatic use
ruby graph_cli.rb -v "Alice,Bob,Carol,David" -j output.json your_graph.csv
```

## Command Reference

### CLI Options

```bash
ruby graph_cli.rb [options] matrix_file

Options:
  -v, --vertices LABELS    # Comma-separated vertex labels
  -f, --format FORMAT      # Output format (text, matrix, json)
  -j, --export-json FILE   # Export to JSON file
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

## MCP Server Tools

The MCP server provides these tools for AI assistants:

- `analyze_relationships` - Extract relationships from structured data and create visualizations
- `create_adjacency_matrix` - Build matrices from relationship pairs  
- `calculate_centrality` - Compute network centrality measures (degree, betweenness, closeness, eigenvector)
- `analyze_network_structure` - Comprehensive network analysis combining relationship extraction and centrality

## Performance

- **Graph creation:** Sub-second for graphs up to 100 nodes
- **DFS/BFS:** Linear time complexity O(V + E)
- **Visualization:** Handles 50+ nodes smoothly in D3.js
- **File formats:** All formats (CSV, JSON, TXT) supported efficiently
- **HTTP API:** Fast response times for network analysis

## Error Handling

The tools provide comprehensive error handling for:
- Invalid matrix formats
- Non-existent vertices in operations  
- Malformed input files
- Missing dependencies
- API validation errors

## Contributing

The codebase follows clean architecture principles with separation of concerns:
- Core graph operations in Ruby
- Web interface with modern JavaScript
- MCP server for AI integration
- Comprehensive API documentation