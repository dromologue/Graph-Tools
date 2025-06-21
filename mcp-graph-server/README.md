# Graph Relationship MCP Server

An MCP (Model Context Protocol) server that analyzes relationships in structured data and creates interactive graph visualizations using the Ruby graph library.

## Features

### Tools
- **analyze_relationships**: Detect relationships in data and create graph representations
- **create_adjacency_matrix**: Build adjacency matrices from relationship data
- **graph_operations**: Perform DFS, BFS, neighbor analysis, and visualization
- **export_graph_web**: Export graphs for web visualization

### Resources
- Sample social network data
- Project dependency examples  
- Organizational chart data

### Prompts
- Relationship analysis workflows
- Social network analysis
- Dependency graph creation

## Installation

```bash
cd mcp-graph-server
npm install
```

## Usage

### Running the Server
```bash
npm start
```

### Configuration for Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "graph-relationships": {
      "command": "node",
      "args": ["/path/to/mcp-graph-server/index.js"],
      "env": {}
    }
  }
}
```

## Example Workflows

### 1. Social Network Analysis
```javascript
// Use the analyze_relationships tool with:
{
  "data": [
    {"id": "Alice", "friends": ["Bob", "Carol"]},
    {"id": "Bob", "friends": ["Alice", "David"]}
  ],
  "relationship_fields": ["friends"],
  "node_label_field": "id"
}
```

### 2. Project Dependencies
```javascript
// Analyze module dependencies:
{
  "data": [
    {"module": "auth", "depends_on": ["utils", "database"]},
    {"module": "api", "depends_on": ["auth", "models"]}
  ],
  "relationship_fields": ["depends_on"],
  "node_label_field": "module"
}
```

### 3. Organizational Structure
```javascript
// Create org chart:
{
  "data": [
    {"employee": "CEO", "reports_to": null},
    {"employee": "CTO", "reports_to": "CEO"}
  ],
  "relationship_fields": ["reports_to"],
  "node_label_field": "employee"
}
```

## Graph Operations

After creating matrices, perform analysis:

- **DFS/BFS**: `graph_operations` with operation type and start vertex
- **Neighbors**: Find connected nodes
- **Visualization**: Generate ASCII art or export for web
- **Web Export**: Create JSON for interactive graph editor

## Integration with Graph Library

The server integrates with the Ruby graph library (`graph.rb`) to:
- Create adjacency matrices from relationship data
- Perform graph traversals and analysis
- Export data for the web-based graph editor
- Generate visualizations and reports

## Sample Data

Access built-in sample datasets:
- `graph://sample-data/social-network`
- `graph://sample-data/project-dependencies`
- `graph://sample-data/organizational-chart`

## Output Files

Generated files are saved in `data/` directory:
- `matrix_*.csv`: Adjacency matrices
- `vertices_*.json`: Vertex labels
- `graph_export.json`: Web visualization data

Use these files with the interactive graph editor for visualization and further editing.