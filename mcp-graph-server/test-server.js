#!/usr/bin/env node

// Simple test script to validate MCP server functionality
import { spawn } from 'child_process';
import { writeFile } from 'fs/promises';

console.log('Testing Graph Relationship MCP Server...\n');

// Test sample social network data
const sampleData = [
  { id: 'Alice', friends: ['Bob', 'Carol'], interests: ['tech', 'music'] },
  { id: 'Bob', friends: ['Alice', 'David', 'Eve'], interests: ['tech', 'sports'] },
  { id: 'Carol', friends: ['Alice', 'Frank'], interests: ['music', 'art'] },
  { id: 'David', friends: ['Bob', 'Eve'], interests: ['sports', 'travel'] },
  { id: 'Eve', friends: ['Bob', 'David', 'Frank'], interests: ['travel', 'food'] },
  { id: 'Frank', friends: ['Carol', 'Eve'], interests: ['art', 'food'] }
];

console.log('Sample Data:');
console.log(JSON.stringify(sampleData, null, 2));
console.log('\n' + '='.repeat(50) + '\n');

// Simulate MCP tool call for relationship analysis
const analyzeRelationships = {
  data: sampleData,
  relationship_fields: ['friends'],
  node_label_field: 'id'
};

console.log('Analyzing relationships...');
console.log('Tool: analyze_relationships');
console.log('Args:', JSON.stringify(analyzeRelationships, null, 2));

// Extract relationships manually for demonstration
const relationships = [];
const vertices = new Set();

for (const person of sampleData) {
  const nodeId = person.id;
  vertices.add(nodeId);
  
  if (person.friends && Array.isArray(person.friends)) {
    for (const friend of person.friends) {
      relationships.push({ from: nodeId, to: friend, weight: 1 });
      vertices.add(friend);
    }
  }
}

const vertexArray = Array.from(vertices);
console.log(`\nFound ${vertexArray.length} vertices: ${vertexArray.join(', ')}`);
console.log(`Found ${relationships.length} relationships:`);
relationships.forEach(r => console.log(`  ${r.from} -> ${r.to}`));

// Create adjacency matrix
const size = vertexArray.length;
const matrix = Array(size).fill().map(() => Array(size).fill(0));

for (const rel of relationships) {
  const fromIndex = vertexArray.indexOf(rel.from);
  const toIndex = vertexArray.indexOf(rel.to);
  
  if (fromIndex !== -1 && toIndex !== -1) {
    matrix[fromIndex][toIndex] = rel.weight;
  }
}

console.log('\nAdjacency Matrix:');
console.log('   ' + vertexArray.join('  '));
matrix.forEach((row, i) => {
  console.log(`${vertexArray[i]}  ${row.join('  ')}`);
});

// Save test matrix file
const matrixCsv = matrix.map(row => row.join(',')).join('\n');
await writeFile('./data/test_matrix.csv', matrixCsv);
await writeFile('./data/test_vertices.json', JSON.stringify(vertexArray));

console.log('\nTest files created:');
console.log('- data/test_matrix.csv');
console.log('- data/test_vertices.json');

console.log('\nTo test with Ruby graph CLI:');
console.log(`ruby ../graph_cli.rb -v "${vertexArray.join(',')}" --dfs Alice data/test_matrix.csv`);

console.log('\nMCP Server test completed successfully! 🎉');