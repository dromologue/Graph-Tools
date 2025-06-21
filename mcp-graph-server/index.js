#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { spawn } from 'child_process';
import { readFile, writeFile, access, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class GraphMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'graph-relationship-server',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
          resources: {}
        }
      }
    );

    this.graphLibPath = join(__dirname, '..', 'graph.rb');
    this.cliPath = join(__dirname, '..', 'graph_cli.rb');
    this.dataDir = join(__dirname, 'data');
    this.filesDir = join(__dirname, '..', 'Files');
    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'analyze_relationships',
          description: 'Analyze relationships in data and create a graph visualization',
          inputSchema: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                description: 'Array of data objects to analyze for relationships',
                items: {
                  type: 'object'
                }
              },
              relationship_fields: {
                type: 'array',
                description: 'Fields to use for determining relationships (e.g., ["id", "parent_id"])',
                items: {
                  type: 'string'
                }
              },
              node_label_field: {
                type: 'string',
                description: 'Field to use as node labels',
                default: 'id'
              }
            },
            required: ['data', 'relationship_fields']
          }
        },
        {
          name: 'create_adjacency_matrix',
          description: 'Create adjacency matrix from relationship data',
          inputSchema: {
            type: 'object',
            properties: {
              relationships: {
                type: 'array',
                description: 'Array of relationship objects with from/to properties',
                items: {
                  type: 'object',
                  properties: {
                    from: { type: 'string' },
                    to: { type: 'string' },
                    weight: { type: 'number', default: 1 }
                  },
                  required: ['from', 'to']
                }
              },
              vertices: {
                type: 'array',
                description: 'Array of vertex names',
                items: {
                  type: 'string'
                }
              }
            },
            required: ['relationships', 'vertices']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'analyze_relationships':
            return await this.analyzeRelationships(args);
          case 'create_adjacency_matrix':
            return await this.createAdjacencyMatrix(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  async analyzeRelationships(args) {
    try {
      const { data, relationship_fields, node_label_field = 'id' } = args;
      
      // Extract relationships from data
      const relationships = [];
      const vertices = new Set();
      
      for (const item of data) {
        const nodeId = String(item[node_label_field] || '');
        if (nodeId) vertices.add(nodeId);
        
        // Handle different relationship patterns
        for (const field of relationship_fields) {
          if (item[field]) {
            if (Array.isArray(item[field])) {
              // One-to-many relationship (e.g., friends array)
              for (const target of item[field]) {
                const targetStr = String(target);
                if (targetStr && targetStr !== nodeId) {
                  relationships.push({ from: nodeId, to: targetStr, weight: 1 });
                  vertices.add(targetStr);
                }
              }
            } else if (item[field] !== null && String(item[field]) !== nodeId) {
              // One-to-one relationship (e.g., reports_to)
              const targetStr = String(item[field]);
              if (targetStr) {
                relationships.push({ from: nodeId, to: targetStr, weight: 1 });
                vertices.add(targetStr);
              }
            }
          }
        }
      }

      const vertexArray = Array.from(vertices).sort();
      
      // Create adjacency matrix and visualization
      const timestamp = Date.now();
      const matrixFile = join(this.dataDir, `matrix_${timestamp}.csv`);
      const vertexFile = join(this.dataDir, `vertices_${timestamp}.json`);
      
      // Create matrix
      const size = vertexArray.length;
      const matrix = Array(size).fill().map(() => Array(size).fill(0));
      
      // Fill matrix with relationship weights
      for (const rel of relationships) {
        const fromIndex = vertexArray.indexOf(rel.from);
        const toIndex = vertexArray.indexOf(rel.to);
        
        if (fromIndex !== -1 && toIndex !== -1) {
          matrix[fromIndex][toIndex] = rel.weight || 1;
        }
      }

      // Save files
      const matrixCsv = matrix.map(row => row.join(',')).join('\n');
      await writeFile(matrixFile, matrixCsv);
      await writeFile(vertexFile, JSON.stringify(vertexArray));

      // Generate visualization using the enhanced template
      const htmlFile = await this.generateVisualization(matrixFile, vertexArray);

      return {
        content: [
          {
            type: 'text',
            text: `🎯 Graph Analysis Complete!

📊 Relationship Analysis Results:
- Vertices found: ${vertexArray.length}
- Relationships found: ${relationships.length}
- Graph density: ${(relationships.length / (vertexArray.length * (vertexArray.length - 1)) || 0).toFixed(3)}

📁 Files Generated:
- Matrix: ${matrixFile}
- Vertices: ${vertexFile}
- Interactive Visualization: ${htmlFile}

🚀 Enhanced Interactive Visualization Features:
✅ Real-time DFS/BFS/Neighbors operations with visual highlighting
✅ Force-directed layout with drag and drop nodes
✅ Step-by-step algorithm results display
✅ Graph statistics and color-coded legend
✅ Adjacency matrix export functionality

Open the HTML file in your browser to explore the graph interactively!

Relationships found:
${relationships.map(r => `  ${r.from} → ${r.to} (weight: ${r.weight})`).join('\n')}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to analyze relationships: ${error.message}`);
    }
  }

  async createAdjacencyMatrix(args) {
    try {
      const { relationships, vertices } = args;
      
      // Validate inputs
      if (!Array.isArray(relationships) || !Array.isArray(vertices)) {
        throw new Error('Invalid input: relationships and vertices must be arrays');
      }

      const timestamp = Date.now();
      const matrixFile = join(this.dataDir, `matrix_${timestamp}.csv`);
      const vertexFile = join(this.dataDir, `vertices_${timestamp}.json`);
      
      // Create adjacency matrix
      const size = vertices.length;
      const matrix = Array(size).fill().map(() => Array(size).fill(0));
      
      // Fill matrix with relationship weights
      for (const rel of relationships) {
        if (rel && rel.from && rel.to) {
          const fromIndex = vertices.indexOf(String(rel.from));
          const toIndex = vertices.indexOf(String(rel.to));
          
          if (fromIndex !== -1 && toIndex !== -1) {
            matrix[fromIndex][toIndex] = Number(rel.weight) || 1;
          }
        }
      }

      // Save files
      const matrixCsv = matrix.map(row => row.join(',')).join('\n');
      await writeFile(matrixFile, matrixCsv);
      await writeFile(vertexFile, JSON.stringify(vertices));

      // Generate visualization
      const htmlFile = await this.generateVisualization(matrixFile, vertices);

      return {
        content: [
          {
            type: 'text',
            text: `🎯 Adjacency Matrix Created Successfully!

📊 Matrix Details:
- Size: ${size}x${size}
- Vertices: ${vertices.join(', ')}
- Edges: ${relationships.length}

📁 Files Generated:
- Matrix: ${matrixFile}
- Vertices: ${vertexFile}
- Interactive Visualization: ${htmlFile}

🚀 The enhanced visualizer includes DFS/BFS highlighting and matrix export functionality!
Open the HTML file to explore your graph interactively.`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to create adjacency matrix: ${error.message}`);
    }
  }

  async generateVisualization(matrixFile, vertices) {
    try {
      // Ensure Files directory exists
      await mkdir(this.filesDir, { recursive: true });
      
      // Use the CLI to generate JSON data
      const timestamp = Date.now();
      const jsonFile = join(this.filesDir, `graph_${timestamp}.json`);
      const htmlFile = join(this.filesDir, `visualization_${timestamp}.html`);
      
      // Generate JSON using CLI
      const vertexArgs = vertices ? `-v "${vertices.join(',')}"` : '';
      const command = `ruby "${this.cliPath}" ${vertexArgs} -j "${jsonFile}" "${matrixFile}"`;
      
      await this.runCommand(command);
      
      // Read the enhanced template
      const templatePath = join(this.filesDir, 'enhanced-graph-visualizer.html');
      let template = await readFile(templatePath, 'utf8');
      
      // Read and validate the generated JSON
      let graphData = { nodes: [], links: [] };
      try {
        const jsonContent = await readFile(jsonFile, 'utf8');
        const cliData = JSON.parse(jsonContent.trim());
        
        if (cliData && cliData.nodes && cliData.edges) {
          graphData = {
            nodes: cliData.nodes.map(node => ({
              id: String(node.id || ''),
              name: String(node.label || node.id || ''),
              category: "default",
              x: Number(node.x) || Math.random() * 400 + 100,
              y: Number(node.y) || Math.random() * 300 + 100
            })),
            links: cliData.edges.map(edge => ({
              source: String(edge.from || ''),
              target: String(edge.to || ''),
              weight: Number(edge.weight) || 1
            }))
          };
        }
      } catch (error) {
        // Use fallback data if JSON parsing fails
        console.warn('JSON parsing failed, using fallback data');
      }

      // Inject the real graph data into the template
      const dataJson = JSON.stringify(graphData, null, 8);
      template = template.replace(
        'let graphData = { nodes: [], links: [] };',
        `let graphData = ${dataJson};`
      );

      // Update the subtitle
      const nodeLabels = vertices ? vertices.join(', ') : 'Graph nodes';
      template = template.replace(
        '<p class="subtitle">Create graphs and run operations with visual feedback</p>',
        `<p class="subtitle">Interactive graph analysis with DFS/BFS operations | Vertices: ${nodeLabels}</p>`
      );

      // Write the complete HTML file
      await writeFile(htmlFile, template);
      
      return htmlFile;
    } catch (error) {
      console.error('Visualization generation error:', error);
      throw new Error(`Failed to generate visualization: ${error.message}`);
    }
  }

  runCommand(command) {
    return new Promise((resolve, reject) => {
      // Split command properly to handle paths with spaces
      const args = command.match(/(?:[^\s"]+|"[^"]*")+/g);
      const cmd = args.shift();
      const processedArgs = args.map(arg => arg.replace(/^"(.*)"$/, '$1'));
      
      const child = spawn(cmd, processedArgs, { 
        shell: false,
        cwd: join(__dirname, '..')
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });
      
      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Graph Relationship MCP Server running on stdio');
  }
}

const server = new GraphMCPServer();
server.run().catch(console.error);