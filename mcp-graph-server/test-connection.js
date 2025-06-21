#!/usr/bin/env node

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testMCPServer() {
  console.log('Testing MCP Server Connection...\n');
  
  const serverPath = join(__dirname, 'index.js');
  console.log(`Server path: ${serverPath}`);
  
  const child = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let stdout = '';
  let stderr = '';
  
  child.stdout.on('data', (data) => {
    stdout += data.toString();
    console.log('STDOUT:', data.toString().trim());
  });
  
  child.stderr.on('data', (data) => {
    stderr += data.toString();
    console.log('STDERR:', data.toString().trim());
  });
  
  // Test initialization message
  const initMessage = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {}
      },
      clientInfo: {
        name: "test-client",
        version: "1.0.0"
      }
    }
  };
  
  console.log('\nSending initialize message...');
  child.stdin.write(JSON.stringify(initMessage) + '\n');
  
  // Wait for response
  setTimeout(() => {
    // Test list tools
    const listToolsMessage = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {}
    };
    
    console.log('\nSending list tools message...');
    child.stdin.write(JSON.stringify(listToolsMessage) + '\n');
    
    setTimeout(() => {
      console.log('\nClosing connection...');
      child.kill();
    }, 2000);
  }, 1000);
  
  child.on('close', (code) => {
    console.log(`\nServer exited with code: ${code}`);
    console.log('Test completed.');
  });
  
  child.on('error', (error) => {
    console.error('Error:', error);
  });
}

testMCPServer().catch(console.error);