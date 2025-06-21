require_relative 'graph'
require 'set'

puts "=== Generating Graph Data for Web Visualization ==="

matrix = [
  [0, 1, 1, 0],
  [1, 0, 1, 1], 
  [1, 1, 0, 1],
  [0, 1, 1, 0]
]
vertices = ['A', 'B', 'C', 'D']

graph = Graph.new(matrix, vertices)

puts "Original graph:"
graph.visualize

puts "\nExporting to JSON for web visualization..."
graph.export_to_json("sample_graph.json")

puts "\nCreating a weighted graph example..."
weighted_graph = Graph.new
['X', 'Y', 'Z'].each { |v| weighted_graph.add_vertex(v) }
weighted_graph.add_edge('X', 'Y', 3)
weighted_graph.add_edge('Y', 'Z', 2)
weighted_graph.add_edge('Z', 'X', 5)

weighted_graph.export_to_json("weighted_graph.json")
puts "Weighted graph exported to weighted_graph.json"

puts "\nTo view the visualization:"
puts "1. Open graph-visualizer.html in your browser"
puts "2. Click 'Load Graph JSON' to load sample_graph.json or weighted_graph.json"
puts "3. Or view the default sample graph that loads automatically"