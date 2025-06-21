#!/usr/bin/env node

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testClaudeIntegration() {
  console.log('🧪 Testing Claude Desktop Integration\n');
  
  const serverPath = join(__dirname, 'mcp-graph-server', 'index.js');
  console.log(`Server: ${serverPath}\n`);
  
  const child = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let stdout = '';
  let stderr = '';
  
  child.stdout.on('data', (data) => {
    const message = data.toString().trim();
    if (message) {
      try {
        const parsed = JSON.parse(message);
        console.log('📨 Server Response:', JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('📝 Server Output:', message);
      }
    }
  });
  
  child.stderr.on('data', (data) => {
    console.log('🔧 Server Log:', data.toString().trim());
  });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 1: Initialize
  console.log('\n🔌 Step 1: Initialize MCP connection');
  const initMessage = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      clientInfo: { name: "claude-desktop-test", version: "1.0.0" }
    }
  };
  child.stdin.write(JSON.stringify(initMessage) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 2: Analyze Sample Data
  console.log('\n📊 Step 2: Analyze sample relationship data');
  const analyzeMessage = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "analyze_relationships",
      arguments: {
        data: [
          { id: "Alice", friends: ["Bob", "Carol"] },
          { id: "Bob", friends: ["Alice", "David"] },
          { id: "Carol", friends: ["Alice"] },
          { id: "David", friends: ["Bob"] }
        ],
        relationship_fields: ["friends"],
        node_label_field: "id"
      }
    }
  };
  child.stdin.write(JSON.stringify(analyzeMessage) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test 3: Create Matrix
  console.log('\n📈 Step 3: Create adjacency matrix');
  const matrixMessage = {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call", 
    params: {
      name: "create_adjacency_matrix",
      arguments: {
        relationships: [
          { from: "A", to: "B", weight: 1 },
          { from: "B", to: "C", weight: 1 },
          { from: "C", to: "A", weight: 1 }
        ],
        vertices: ["A", "B", "C"]
      }
    }
  };
  child.stdin.write(JSON.stringify(matrixMessage) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('\n✅ Test completed. Closing connection...');
  child.kill();
}

testClaudeIntegration().catch(console.error);