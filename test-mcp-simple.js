const { spawn } = require('child_process');
const path = require('path');

async function testMCPServer() {
  console.log('🧪 Testing MCP Server with Sample Data\n');
  
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
          console.log('📊 MCP Response Content:');
          console.log(parsed.result.content[0].text);
          console.log('\n' + '='.repeat(50) + '\n');
        } else {
          console.log('📨 Server Response:', JSON.stringify(parsed, null, 2));
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
  
  // Test relationship analysis
  console.log('📊 Testing relationship analysis...');
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
  
  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('✅ Test completed.');
  child.kill();
}

testMCPServer().catch(console.error);