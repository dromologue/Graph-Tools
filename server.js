const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/files', express.static('Files'));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir('uploads', { recursive: true });
    await fs.mkdir('Files', { recursive: true });
    await fs.mkdir('public', { recursive: true });
  } catch (error) {
    console.log('Directories already exist or created successfully');
  }
}

// Helper function to run Ruby CLI
function runRubyCommand(args) {
  return new Promise((resolve, reject) => {
    const ruby = spawn('ruby', ['graph_cli.rb', ...args]);
    
    let stdout = '';
    let stderr = '';
    
    ruby.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    ruby.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    ruby.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Ruby command failed: ${stderr}`));
      }
    });
  });
}

// Routes

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to analyze graph from matrix
app.post('/api/analyze', upload.single('matrix'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No matrix file uploaded' });
    }

    const { vertices, operation, startVertex } = req.body;
    const matrixPath = req.file.path;
    
    // Build Ruby command arguments
    const args = [];
    if (vertices) {
      args.push('-v', vertices);
    }
    
    if (operation === 'dfs' && startVertex) {
      args.push('--dfs', startVertex);
    } else if (operation === 'bfs' && startVertex) {
      args.push('--bfs', startVertex);
    } else if (operation === 'neighbors' && startVertex) {
      args.push('--neighbors', startVertex);
    }
    
    // Always export to D3 format for web display
    args.push('-d');
    args.push(matrixPath);
    
    const result = await runRubyCommand(args);
    
    // Find the generated JSON file
    const files = await fs.readdir('Files');
    const jsonFiles = files
      .filter(f => f.startsWith('graph_d3_') && f.endsWith('.json'))
      .sort((a, b) => {
        const timeA = parseInt(a.match(/graph_d3_(\d+)\.json/)[1]);
        const timeB = parseInt(b.match(/graph_d3_(\d+)\.json/)[1]);
        return timeB - timeA; // Most recent first
      });
    
    if (jsonFiles.length > 0) {
      const latestJsonFile = jsonFiles[0];
      const graphData = await fs.readFile(path.join('Files', latestJsonFile), 'utf8');
      
      res.json({
        success: true,
        output: result.stdout,
        graphData: JSON.parse(graphData),
        visualizationUrl: `/files/enhanced-graph-visualizer.html`
      });
    } else {
      res.json({
        success: true,
        output: result.stdout,
        message: 'Analysis completed but no visualization data generated'
      });
    }
    
    // Clean up uploaded file
    await fs.unlink(matrixPath);
    
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Analysis failed', 
      details: error.message 
    });
  }
});

// API endpoint to create sample data
app.post('/api/sample', async (req, res) => {
  try {
    const { type } = req.body;
    
    let matrixData = '';
    let vertices = '';
    
    if (type === 'social') {
      matrixData = '0,1,1,0\n1,0,1,1\n1,1,0,0\n0,1,0,0';
      vertices = 'Alice,Bob,Carol,David';
    } else if (type === 'dependency') {
      matrixData = '0,1,1,0\n0,0,1,1\n0,0,0,1\n0,0,0,0';
      vertices = 'Frontend,API,Database,Utils';
    } else {
      matrixData = '0,1,0,1\n1,0,1,0\n0,1,0,1\n1,0,1,0';
      vertices = 'A,B,C,D';
    }
    
    // Create temporary file
    const tempFile = path.join('uploads', `sample_${Date.now()}.csv`);
    await fs.writeFile(tempFile, matrixData);
    
    // Analyze with Ruby CLI
    const args = ['-v', vertices, '-d', tempFile];
    const result = await runRubyCommand(args);
    
    // Get the generated visualization data
    const files = await fs.readdir('Files');
    const jsonFiles = files
      .filter(f => f.startsWith('graph_d3_') && f.endsWith('.json'))
      .sort((a, b) => {
        const timeA = parseInt(a.match(/graph_d3_(\d+)\.json/)[1]);
        const timeB = parseInt(b.match(/graph_d3_(\d+)\.json/)[1]);
        return timeB - timeA;
      });
    
    if (jsonFiles.length > 0) {
      const latestJsonFile = jsonFiles[0];
      const graphData = await fs.readFile(path.join('Files', latestJsonFile), 'utf8');
      
      res.json({
        success: true,
        output: result.stdout,
        graphData: JSON.parse(graphData),
        type: type,
        vertices: vertices.split(',')
      });
    } else {
      res.status(500).json({ error: 'Failed to generate sample data' });
    }
    
    // Clean up temp file
    await fs.unlink(tempFile);
    
  } catch (error) {
    console.error('Sample generation error:', error);
    res.status(500).json({ 
      error: 'Sample generation failed', 
      details: error.message 
    });
  }
});

// API endpoint to get graph information
app.get('/api/info', async (req, res) => {
  try {
    // Run basic Ruby command to get help
    const result = await runRubyCommand(['--help']);
    
    res.json({
      success: true,
      info: result.stdout,
      features: [
        'Adjacency Matrix Analysis',
        'DFS/BFS Traversal',
        'Interactive Visualizations',
        'Multiple File Format Support',
        'Graph Statistics'
      ]
    });
  } catch (error) {
    res.json({
      success: true,
      info: 'Graph Tools - Interactive Analysis Toolkit',
      features: [
        'Adjacency Matrix Analysis',
        'DFS/BFS Traversal', 
        'Interactive Visualizations',
        'Multiple File Format Support',
        'Graph Statistics'
      ]
    });
  }
});

// Start server
ensureDirectories().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Graph Tools Web Server running on port ${PORT}`);
    console.log(`📊 Visit http://localhost:${PORT} to access the application`);
    console.log(`📁 Files served from: ${path.join(__dirname, 'Files')}`);
  });
}).catch(console.error);