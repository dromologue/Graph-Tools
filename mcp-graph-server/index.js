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
import { spawn, exec } from 'child_process';
import { readFile, writeFile, access, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execAsync = promisify(exec);

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
      const visualizationResult = await this.generateVisualization(matrixFile, vertexArray);

      const openStatus = visualizationResult.opened ? 
        '🚀 Visualization automatically opened in your browser!' : 
        '📁 Visualization file created (manual opening required)';

      return {
        content: [
          {
            type: 'text',
            text: `🎯 Graph Analysis Complete!

📊 Relationship Analysis Results:
- Vertices found: ${vertexArray.length}
- Relationships found: ${relationships.length}
- Graph density: ${(relationships.length / (vertexArray.length * (vertexArray.length - 1)) || 0).toFixed(3)}

📁 Unique Files Generated:
- Matrix: ${matrixFile}
- Vertices: ${vertexFile}
- Graph Data: ${visualizationResult.jsonFilename}
- Interactive Visualization: ${visualizationResult.htmlFilename}

${openStatus}

🚀 Enhanced Interactive Visualization Features:
✅ Real-time DFS/BFS/Neighbors operations with visual highlighting
✅ Force-directed layout with drag and drop nodes
✅ Step-by-step algorithm results display
✅ Graph statistics and color-coded legend
✅ Adjacency matrix export functionality

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
      const visualizationResult = await this.generateVisualization(matrixFile, vertices);

      const openStatus = visualizationResult.opened ? 
        '🚀 Visualization automatically opened in your browser!' : 
        '📁 Visualization file created (manual opening required)';

      return {
        content: [
          {
            type: 'text',
            text: `🎯 Adjacency Matrix Created Successfully!

📊 Matrix Details:
- Size: ${size}x${size}
- Vertices: ${vertices.join(', ')}
- Edges: ${relationships.length}

📁 Unique Files Generated:
- Matrix: ${matrixFile}
- Vertices: ${vertexFile}
- Graph Data: ${visualizationResult.jsonFilename}
- Interactive Visualization: ${visualizationResult.htmlFilename}

${openStatus}

🚀 The enhanced visualizer includes DFS/BFS highlighting and matrix export functionality!`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to create adjacency matrix: ${error.message}`);
    }
  }

  generateUniqueFilename(prefix, vertices, extension) {
    const timestamp = Date.now();
    const nodeCount = vertices ? vertices.length : 0;
    const vertexSummary = vertices && vertices.length <= 4 ? 
      `_${vertices.join('-')}` : 
      `_${nodeCount}nodes`;
    
    return `${prefix}_${timestamp}${vertexSummary}.${extension}`;
  }

  async openVisualization(htmlFile) {
    try {
      const platform = process.platform;
      let command;
      
      if (platform === 'darwin') {
        command = `open "${htmlFile}"`;
      } else if (platform === 'win32') {
        command = `start "${htmlFile}"`;
      } else if (platform === 'linux') {
        command = `xdg-open "${htmlFile}"`;
      }
      
      if (command) {
        console.log(`Opening visualization: ${htmlFile}`);
        await execAsync(command);
        return true;
      }
    } catch (error) {
      console.warn(`Could not auto-open visualization: ${error.message}`);
    }
    return false;
  }

  async generateVisualization(matrixFile, vertices) {
    try {
      // Ensure Files directory exists
      await mkdir(this.filesDir, { recursive: true });
      
      // Generate unique, descriptive filenames
      const jsonFilename = this.generateUniqueFilename('graph_data', vertices, 'json');
      const htmlFilename = this.generateUniqueFilename('visualization', vertices, 'html');
      
      const jsonFile = join(this.filesDir, jsonFilename);
      const htmlFile = join(this.filesDir, htmlFilename);
      
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
      
      // Automatically open the visualization
      const opened = await this.openVisualization(htmlFile);
      
      return {
        htmlFile,
        htmlFilename,
        jsonFile,
        jsonFilename,
        opened
      };
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