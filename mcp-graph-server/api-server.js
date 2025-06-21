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
import express from 'express';
import cors from 'cors';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execAsync = promisify(exec);

class GraphAPIServer {
  constructor() {
    // MCP Server setup
    this.mcpServer = new Server(
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

    // HTTP Server setup
    this.app = express();
    this.port = process.env.PORT || 3001;
    
    this.graphLibPath = join(__dirname, '..', 'graph.rb');
    this.cliPath = join(__dirname, '..', 'graph_cli.rb');
    this.dataDir = join(__dirname, 'data');
    this.filesDir = join(__dirname, '..', 'Files');
    
    this.setupMCPHandlers();
    this.setupHTTPRoutes();
  }

  setupMCPHandlers() {
    this.mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
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
        },
        {
          name: 'calculate_centrality',
          description: 'Calculate centrality measures for graph nodes',
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
              },
              measures: {
                type: 'array',
                description: 'Centrality measures to calculate: degree, betweenness, closeness, eigenvector',
                items: {
                  type: 'string',
                  enum: ['degree', 'betweenness', 'closeness', 'eigenvector', 'all']
                },
                default: ['all']
              },
              top_n: {
                type: 'number',
                description: 'Number of top nodes to return for each measure',
                default: 10
              }
            },
            required: ['relationships', 'vertices']
          }
        },
        {
          name: 'analyze_network_structure',
          description: 'Comprehensive network analysis including centrality measures and structure',
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
              },
              include_centrality: {
                type: 'boolean',
                description: 'Whether to include centrality analysis',
                default: true
              }
            },
            required: ['data', 'relationship_fields']
          }
        }
      ]
    }));

    this.mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'analyze_relationships':
            return await this.analyzeRelationships(args);
          case 'create_adjacency_matrix':
            return await this.createAdjacencyMatrix(args);
          case 'calculate_centrality':
            return await this.calculateCentrality(args);
          case 'analyze_network_structure':
            return await this.analyzeNetworkStructure(args);
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

  setupHTTPRoutes() {
    // Middleware
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Configure multer for file uploads
    const upload = multer({ 
      dest: 'uploads/',
      limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // API information endpoint
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'Graph Analysis API',
        version: '1.0.0',
        endpoints: [
          'POST /api/analyze-relationships',
          'POST /api/create-adjacency-matrix', 
          'POST /api/calculate-centrality',
          'POST /api/analyze-network-structure'
        ],
        documentation: '/api/docs'
      });
    });

    // REST API endpoints
    this.app.post('/api/analyze-relationships', async (req, res) => {
      try {
        const result = await this.analyzeRelationships(req.body);
        res.json(this.formatHTTPResponse(result));
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.post('/api/create-adjacency-matrix', async (req, res) => {
      try {
        const result = await this.createAdjacencyMatrix(req.body);
        res.json(this.formatHTTPResponse(result));
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.post('/api/calculate-centrality', async (req, res) => {
      try {
        const result = await this.calculateCentrality(req.body);
        res.json(this.formatHTTPResponse(result));
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.post('/api/analyze-network-structure', async (req, res) => {
      try {
        const result = await this.analyzeNetworkStructure(req.body);
        res.json(this.formatHTTPResponse(result));
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // File upload endpoint for matrix analysis
    this.app.post('/api/upload-matrix', upload.single('matrix'), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        const { vertices, operation, startVertex } = req.body;
        const matrixFile = req.file.path;
        
        // Process the uploaded matrix file
        const vertexArray = vertices ? vertices.split(',').map(v => v.trim()) : [];
        const visualizationResult = await this.generateVisualization(matrixFile, vertexArray);

        res.json({
          success: true,
          message: 'Matrix processed successfully',
          files: {
            matrix: matrixFile,
            visualization: visualizationResult.htmlFilename,
            graph_data: visualizationResult.jsonFilename
          },
          visualization_url: `/files/${visualizationResult.htmlFilename}`
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Serve generated files
    this.app.use('/files', express.static(this.filesDir));
    this.app.use('/data', express.static(this.dataDir));

    // Error handler
    this.app.use((error, req, res, next) => {
      console.error('API Error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    });
  }

  formatHTTPResponse(mcpResult) {
    if (mcpResult.isError) {
      return {
        success: false,
        error: mcpResult.content[0].text
      };
    }

    return {
      success: true,
      data: mcpResult.content[0].text,
      timestamp: new Date().toISOString()
    };
  }

  // Copy all the analysis methods from the original MCP server
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

  async calculateCentrality(args) {
    try {
      const { relationships, vertices, measures = ['all'], top_n = 10 } = args;
      
      // Validate inputs
      if (!Array.isArray(relationships) || !Array.isArray(vertices)) {
        throw new Error('Invalid input: relationships and vertices must be arrays');
      }

      // Build graph structure
      const graph = this.buildGraphStructure(relationships, vertices);
      const results = {};
      const requestedMeasures = measures.includes('all') ? 
        ['degree', 'betweenness', 'closeness', 'eigenvector'] : measures;

      // Calculate each requested centrality measure
      for (const measure of requestedMeasures) {
        switch (measure) {
          case 'degree':
            results.degree = this.calculateDegreeCentrality(graph, vertices);
            break;
          case 'betweenness':
            results.betweenness = this.calculateBetweennessCentrality(graph, vertices);
            break;
          case 'closeness':
            results.closeness = this.calculateClosenessCentrality(graph, vertices);
            break;
          case 'eigenvector':
            results.eigenvector = this.calculateEigenvectorCentrality(graph, vertices);
            break;
        }
      }

      // Format results for display
      let responseText = '🎯 Centrality Analysis Complete!\n\n';
      
      for (const [measure, scores] of Object.entries(results)) {
        const sorted = Object.entries(scores)
          .map(([node, score]) => ({ node, score: Number(score) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, top_n);

        responseText += `📊 **${measure.charAt(0).toUpperCase() + measure.slice(1)} Centrality**\n`;
        responseText += sorted.map((item, idx) => 
          `${idx + 1}. ${item.node}: ${item.score.toFixed(4)}`
        ).join('\n');
        responseText += '\n\n';
      }

      responseText += `🔍 **Analysis Summary:**\n`;
      responseText += `- Vertices analyzed: ${vertices.length}\n`;
      responseText += `- Relationships: ${relationships.length}\n`;
      responseText += `- Measures calculated: ${Object.keys(results).join(', ')}\n`;
      responseText += `- Top nodes shown: ${Math.min(top_n, vertices.length)}`;

      return {
        content: [
          {
            type: 'text',
            text: responseText
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to calculate centrality: ${error.message}`);
    }
  }

  async analyzeNetworkStructure(args) {
    try {
      const { data, relationship_fields, node_label_field = 'id', include_centrality = true } = args;
      
      // First analyze relationships
      const relationshipResult = await this.analyzeRelationships({
        data,
        relationship_fields,
        node_label_field
      });

      if (!include_centrality) {
        return relationshipResult;
      }

      // Extract relationships and vertices for centrality analysis
      const relationships = [];
      const vertices = new Set();
      
      for (const item of data) {
        const nodeId = String(item[node_label_field] || '');
        if (nodeId) vertices.add(nodeId);
        
        for (const field of relationship_fields) {
          if (item[field]) {
            if (Array.isArray(item[field])) {
              for (const target of item[field]) {
                const targetStr = String(target);
                if (targetStr && targetStr !== nodeId) {
                  relationships.push({ from: nodeId, to: targetStr, weight: 1 });
                  vertices.add(targetStr);
                }
              }
            } else if (item[field] !== null && String(item[field]) !== nodeId) {
              const targetStr = String(item[field]);
              if (targetStr) {
                relationships.push({ from: nodeId, to: targetStr, weight: 1 });
                vertices.add(targetStr);
              }
            }
          }
        }
      }

      // Calculate centrality measures
      const centralityResult = await this.calculateCentrality({
        relationships,
        vertices: Array.from(vertices),
        measures: ['all'],
        top_n: 5
      });

      // Combine results
      const combinedText = relationshipResult.content[0].text + '\n\n' +
        '🎯 **Network Centrality Analysis:**\n' +
        centralityResult.content[0].text.split('🎯 Centrality Analysis Complete!')[1];

      return {
        content: [
          {
            type: 'text',
            text: combinedText
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to analyze network structure: ${error.message}`);
    }
  }

  // Include all helper methods from original server...
  buildGraphStructure(relationships, vertices) {
    const adjacencyList = {};
    const adjacencyMatrix = {};
    
    // Initialize adjacency structures
    for (const vertex of vertices) {
      adjacencyList[vertex] = [];
      adjacencyMatrix[vertex] = {};
      for (const otherVertex of vertices) {
        adjacencyMatrix[vertex][otherVertex] = 0;
      }
    }
    
    // Populate with relationships
    for (const rel of relationships) {
      const { from, to, weight = 1 } = rel;
      if (from && to && vertices.includes(from) && vertices.includes(to)) {
        adjacencyList[from].push({ node: to, weight });
        adjacencyMatrix[from][to] = weight;
      }
    }
    
    return { adjacencyList, adjacencyMatrix, vertices };
  }

  calculateDegreeCentrality(graph, vertices) {
    const { adjacencyList } = graph;
    const centrality = {};
    
    for (const vertex of vertices) {
      const outDegree = adjacencyList[vertex].length;
      const inDegree = vertices.filter(v => 
        adjacencyList[v].some(neighbor => neighbor.node === vertex)
      ).length;
      centrality[vertex] = (outDegree + inDegree) / (vertices.length - 1);
    }
    
    return centrality;
  }

  calculateBetweennessCentrality(graph, vertices) {
    const centrality = {};
    vertices.forEach(v => centrality[v] = 0);
    
    // For each pair of vertices
    for (let s = 0; s < vertices.length; s++) {
      for (let t = s + 1; t < vertices.length; t++) {
        const source = vertices[s];
        const target = vertices[t];
        
        // Find all shortest paths between source and target
        const paths = this.findAllShortestPaths(graph, source, target);
        if (paths.length === 0) continue;
        
        // Count how many paths pass through each vertex
        for (const vertex of vertices) {
          if (vertex === source || vertex === target) continue;
          
          const pathsThrough = paths.filter(path => path.includes(vertex)).length;
          centrality[vertex] += pathsThrough / paths.length;
        }
      }
    }
    
    // Normalize
    const n = vertices.length;
    const normalizationFactor = ((n - 1) * (n - 2)) / 2;
    if (normalizationFactor > 0) {
      vertices.forEach(v => centrality[v] /= normalizationFactor);
    }
    
    return centrality;
  }

  calculateClosenessCentrality(graph, vertices) {
    const centrality = {};
    
    for (const vertex of vertices) {
      const distances = this.dijkstra(graph, vertex);
      const validDistances = Object.values(distances).filter(d => d !== Infinity && d > 0);
      
      if (validDistances.length === 0) {
        centrality[vertex] = 0;
      } else {
        const avgDistance = validDistances.reduce((sum, d) => sum + d, 0) / validDistances.length;
        centrality[vertex] = avgDistance > 0 ? 1 / avgDistance : 0;
      }
    }
    
    return centrality;
  }

  calculateEigenvectorCentrality(graph, vertices, maxIterations = 100, tolerance = 1e-6) {
    const { adjacencyMatrix } = graph;
    const n = vertices.length;
    
    // Initialize eigenvector
    let centrality = {};
    vertices.forEach(v => centrality[v] = 1 / Math.sqrt(n));
    
    for (let iter = 0; iter < maxIterations; iter++) {
      const newCentrality = {};
      
      // Matrix-vector multiplication: A * x
      for (const vertex of vertices) {
        newCentrality[vertex] = 0;
        for (const neighbor of vertices) {
          newCentrality[vertex] += adjacencyMatrix[neighbor][vertex] * centrality[neighbor];
        }
      }
      
      // Normalize
      const norm = Math.sqrt(Object.values(newCentrality).reduce((sum, val) => sum + val * val, 0));
      if (norm > 0) {
        vertices.forEach(v => newCentrality[v] /= norm);
      }
      
      // Check convergence
      const diff = vertices.reduce((sum, v) => 
        sum + Math.abs(newCentrality[v] - centrality[v]), 0
      );
      
      centrality = newCentrality;
      
      if (diff < tolerance) break;
    }
    
    return centrality;
  }

  findAllShortestPaths(graph, source, target) {
    const { adjacencyList } = graph;
    const distances = {};
    const predecessors = {};
    const visited = new Set();
    const queue = [source];
    
    // Initialize distances
    distances[source] = 0;
    predecessors[source] = [];
    
    // BFS to find shortest paths
    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      visited.add(current);
      
      for (const neighbor of adjacencyList[current] || []) {
        const next = neighbor.node;
        const newDist = distances[current] + (neighbor.weight || 1);
        
        if (!(next in distances) || newDist < distances[next]) {
          distances[next] = newDist;
          predecessors[next] = [current];
          queue.push(next);
        } else if (newDist === distances[next]) {
          predecessors[next].push(current);
        }
      }
    }
    
    // Reconstruct all shortest paths
    if (!(target in distances)) return [];
    
    const paths = [];
    const buildPaths = (node, currentPath) => {
      if (node === source) {
        paths.push([source, ...currentPath.reverse()]);
        return;
      }
      
      for (const pred of predecessors[node] || []) {
        buildPaths(pred, [node, ...currentPath]);
      }
    };
    
    buildPaths(target, []);
    return paths;
  }

  dijkstra(graph, source) {
    const { adjacencyList } = graph;
    const distances = {};
    const visited = new Set();
    const priorityQueue = [{ node: source, distance: 0 }];
    
    // Initialize distances
    distances[source] = 0;
    
    while (priorityQueue.length > 0) {
      // Simple priority queue (sort by distance)
      priorityQueue.sort((a, b) => a.distance - b.distance);
      const { node: current, distance: currentDist } = priorityQueue.shift();
      
      if (visited.has(current)) continue;
      visited.add(current);
      
      for (const neighbor of adjacencyList[current] || []) {
        const next = neighbor.node;
        const weight = neighbor.weight || 1;
        const newDist = currentDist + weight;
        
        if (!(next in distances) || newDist < distances[next]) {
          distances[next] = newDist;
          priorityQueue.push({ node: next, distance: newDist });
        }
      }
    }
    
    return distances;
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

  async startHTTPServer() {
    // Ensure data directory exists
    await mkdir(this.dataDir, { recursive: true });
    
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`🚀 Graph API Server running on http://localhost:${this.port}`);
        console.log(`📊 API endpoints available at http://localhost:${this.port}/api`);
        console.log(`🔍 Health check: http://localhost:${this.port}/health`);
        resolve();
      });
    });
  }

  async runMCPServer() {
    const transport = new StdioServerTransport();
    await this.mcpServer.connect(transport);
    console.error('Graph Relationship MCP Server running on stdio');
  }

  async run() {
    const mode = process.env.SERVER_MODE || 'auto';
    
    if (mode === 'http' || (!process.stdin.isTTY && mode !== 'mcp')) {
      // HTTP mode - start web server
      await this.startHTTPServer();
    } else if (mode === 'mcp' || process.stdin.isTTY) {
      // MCP mode - run as MCP server
      await this.runMCPServer();
    } else {
      // Auto mode - detect based on environment
      if (process.stdin.isTTY) {
        await this.startHTTPServer();
      } else {
        await this.runMCPServer();
      }
    }
  }
}

const server = new GraphAPIServer();
server.run().catch(console.error);