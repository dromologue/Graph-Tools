const { spawn } = require('child_process');
const path = require('path');

async function testUpdatedMCP() {
  console.log('🧪 Testing Updated MCP Server with Unique Filenames\n');
  
  const serverPath = path.join(__dirname, 'mcp-graph-server', 'index.js');
  console.log(`Server: ${serverPath}\n`);
  
  const child = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  child.stdout.on('data', (data) => {
    const message = data.toString().trim();
    if (message) {
      try {
        const parsed = JSON.parse(message);
        if (parsed.result && parsed.result.content) {
          console.log('📊 MCP Response:');
          console.log(parsed.result.content[0].text);
          console.log('\n' + '='.repeat(60) + '\n');
        }
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
  
  // Initialize
  console.log('🔌 Initializing MCP connection...');
  const initMessage = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      clientInfo: { name: "test-client", version: "1.0.0" }
    }
  };
  child.stdin.write(JSON.stringify(initMessage) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test with small social network
  console.log('📊 Testing with social network data...');
  const socialMessage = {
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
  child.stdin.write(JSON.stringify(socialMessage) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 4000));
  
  // Test with simple matrix
  console.log('📈 Testing adjacency matrix creation...');
  const matrixMessage = {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "create_adjacency_matrix",
      arguments: {
        relationships: [
          { from: "X", to: "Y", weight: 1 },
          { from: "Y", to: "Z", weight: 1 },
          { from: "Z", to: "X", weight: 1 }
        ],
        vertices: ["X", "Y", "Z"]
      }
    }
  };
  child.stdin.write(JSON.stringify(matrixMessage) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 4000));
  
  console.log('✅ Test completed.');
  child.kill();
}

testUpdatedMCP().catch(console.error);