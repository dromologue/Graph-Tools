require_relative 'graph'
require 'set'

puts "=== Graph Operations Example ==="

matrix = [
  [0, 1, 1, 0],
  [1, 0, 1, 1],
  [1, 1, 0, 1],
  [0, 1, 1, 0]
]
vertices = ['A', 'B', 'C', 'D']

graph = Graph.new(matrix, vertices)

puts "\nInitial graph:"
puts graph
graph.display_matrix

puts "\nNeighbors of A: #{graph.get_neighbors('A')}"
puts "Has edge A->B? #{graph.has_edge?('A', 'B')}"
puts "Has edge A->D? #{graph.has_edge?('A', 'D')}"

puts "\nDFS traversal from A:"
dfs_result = graph.dfs('A') { |vertex| print "#{vertex} " }
puts "\nDFS result: #{dfs_result}"

puts "\nBFS traversal from A:"
bfs_result = graph.bfs('A') { |vertex| print "#{vertex} " }
puts "\nBFS result: #{bfs_result}"

puts "\nAdding vertex E and edge A->E:"
graph.add_vertex('E')
graph.add_edge('A', 'E', 2)
graph.display_matrix

puts "\nRemoving edge B->C:"
graph.remove_edge('B', 'C')
graph.display_matrix

puts "\n=== Creating new empty graph ==="
empty_graph = Graph.new

puts "Adding vertices 1, 2, 3:"
[1, 2, 3].each { |v| empty_graph.add_vertex(v) }

puts "Adding edges:"
empty_graph.add_edge(1, 2)
empty_graph.add_edge(2, 3)
empty_graph.add_edge(3, 1)

empty_graph.display_matrix

puts "\nDFS from vertex 1: #{empty_graph.dfs(1)}"
puts "BFS from vertex 1: #{empty_graph.bfs(1)}"

puts "\n=== Graph Visualizations ==="
puts "\nOriginal graph visualization:"
graph.visualize

puts "\nEmpty graph visualization:"
empty_graph.visualize