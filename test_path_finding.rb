#!/usr/bin/env ruby

require_relative 'graph'
require 'test/unit'
require 'tempfile'
require 'json'

class TestPathFinding < Test::Unit::TestCase
  
  def setup
    # Create a complex test graph for path finding
    # Graph structure:
    # A -> B -> D -> F
    # |    |    ^    ^
    # v    v    |    |
    # C -> E ---+----+
    @complex_matrix = [
      [0, 1, 1, 0, 0, 0],  # A -> B, C
      [0, 0, 0, 1, 1, 0],  # B -> D, E  
      [0, 0, 0, 0, 1, 0],  # C -> E
      [0, 0, 0, 0, 0, 1],  # D -> F
      [0, 0, 0, 1, 0, 1],  # E -> D, F
      [0, 0, 0, 0, 0, 0]   # F (no outgoing edges)
    ]
    @complex_vertices = ['A', 'B', 'C', 'D', 'E', 'F']
    @complex_graph = Graph.new(@complex_matrix, @complex_vertices)
    
    # Simple linear graph A -> B -> C
    @linear_matrix = [
      [0, 1, 0],
      [0, 0, 1],
      [0, 0, 0]
    ]
    @linear_vertices = ['A', 'B', 'C'] 
    @linear_graph = Graph.new(@linear_matrix, @linear_vertices)
    
    # Disconnected graph with two components
    @disconnected_matrix = [
      [0, 1, 0, 0],
      [1, 0, 0, 0], 
      [0, 0, 0, 1],
      [0, 0, 1, 0]
    ]
    @disconnected_vertices = ['A', 'B', 'C', 'D']
    @disconnected_graph = Graph.new(@disconnected_matrix, @disconnected_vertices)
  end

  def test_shortest_path_exists
    # Test basic shortest path functionality
    path = @complex_graph.shortest_path('A', 'F')
    assert_equal 4, path.length
    assert_equal 'A', path.first
    assert_equal 'F', path.last
    
    # Should be one of two possible shortest paths
    valid_paths = [
      ['A', 'B', 'D', 'F'],
      ['A', 'B', 'E', 'F']
    ]
    assert_includes valid_paths, path
  end

  def test_shortest_path_direct_connection
    path = @complex_graph.shortest_path('A', 'B')
    assert_equal ['A', 'B'], path
  end

  def test_shortest_path_same_vertex
    path = @complex_graph.shortest_path('A', 'A')
    assert_equal ['A'], path
  end

  def test_shortest_path_no_path
    # Test disconnected components
    path = @disconnected_graph.shortest_path('A', 'C')
    assert_equal [], path
    
    path_reverse = @disconnected_graph.shortest_path('C', 'A')
    assert_equal [], path_reverse
  end

  def test_shortest_path_invalid_vertices
    # Non-existent start vertex
    path = @complex_graph.shortest_path('Z', 'A')
    assert_equal [], path
    
    # Non-existent end vertex
    path = @complex_graph.shortest_path('A', 'Z')
    assert_equal [], path
    
    # Both non-existent
    path = @complex_graph.shortest_path('X', 'Y')
    assert_equal [], path
  end

  def test_shortest_path_linear_graph
    # Test linear progression
    path = @linear_graph.shortest_path('A', 'C')
    assert_equal ['A', 'B', 'C'], path
    
    # Test reverse (should be empty in directed graph)
    reverse_path = @linear_graph.shortest_path('C', 'A')
    assert_equal [], reverse_path
  end

  def test_shortest_path_undirected_basic
    # Test undirected behavior on linear graph
    path = @linear_graph.shortest_path_undirected('A', 'C')
    assert_equal ['A', 'B', 'C'], path
    
    # Test reverse path (should work in undirected mode)
    reverse_path = @linear_graph.shortest_path_undirected('C', 'A')
    assert_equal ['C', 'B', 'A'], reverse_path
  end

  def test_shortest_path_undirected_complex
    # Test on complex graph
    path_af = @complex_graph.shortest_path_undirected('A', 'F')
    assert_equal 4, path_af.length
    assert_equal 'A', path_af.first
    assert_equal 'F', path_af.last
    
    # Test reverse path
    path_fa = @complex_graph.shortest_path_undirected('F', 'A')
    assert_equal 4, path_fa.length
    assert_equal 'F', path_fa.first
    assert_equal 'A', path_fa.last
  end

  def test_shortest_path_cycle_graph
    # Create a cycle: A -> B -> C -> A
    cycle_matrix = [
      [0, 1, 0],
      [0, 0, 1], 
      [1, 0, 0]
    ]
    cycle_vertices = ['A', 'B', 'C']
    cycle_graph = Graph.new(cycle_matrix, cycle_vertices)
    
    # Test paths in cycle
    path_ab = cycle_graph.shortest_path('A', 'B')
    assert_equal ['A', 'B'], path_ab
    
    path_ac = cycle_graph.shortest_path('A', 'C')
    assert_equal ['A', 'B', 'C'], path_ac
    
    # Test undirected paths in cycle
    path_ca_undirected = cycle_graph.shortest_path_undirected('C', 'A')
    assert_equal ['C', 'A'], path_ca_undirected  # Direct reverse connection
  end

  def test_shortest_path_self_loop
    # Create graph with self-loop
    self_loop_matrix = [
      [1, 1, 0],
      [0, 0, 1],
      [0, 0, 0]
    ]
    self_loop_vertices = ['A', 'B', 'C']
    self_loop_graph = Graph.new(self_loop_matrix, self_loop_vertices)
    
    # Path to self should still be just the vertex
    path = self_loop_graph.shortest_path('A', 'A')
    assert_equal ['A'], path
    
    # Normal paths should work
    path_ac = self_loop_graph.shortest_path('A', 'C')
    assert_equal ['A', 'B', 'C'], path_ac
  end

  def test_shortest_path_performance
    # Create larger graph for performance testing
    size = 20
    large_matrix = Array.new(size) { Array.new(size, 0) }
    
    # Create a path from 0 to size-1
    (0...size-1).each do |i|
      large_matrix[i][i+1] = 1
    end
    
    # Add some additional random edges
    (0...size).each do |i|
      (0...size).each do |j|
        if i != j && rand < 0.1
          large_matrix[i][j] = 1
        end
      end
    end
    
    large_vertices = (0...size).map { |i| "Node#{i}" }
    large_graph = Graph.new(large_matrix, large_vertices)
    
    start_time = Time.now
    path = large_graph.shortest_path('Node0', "Node#{size-1}")
    duration = Time.now - start_time
    
    assert duration < 1.0, "Path finding took too long: #{duration}s"
    assert path.length > 0, "Should find a path in connected graph"
    assert_equal 'Node0', path.first
    assert_equal "Node#{size-1}", path.last
  end

  def test_path_finding_with_json_export
    # Test integration with JSON export
    path = @complex_graph.shortest_path('A', 'F')
    
    # Export to JSON and verify path data could be included
    json_data = @complex_graph.to_json_data
    
    # Verify all nodes in path exist in JSON
    path.each do |vertex|
      node_exists = json_data[:nodes].any? { |node| node[:id] == vertex }
      assert node_exists, "Node #{vertex} from path should exist in JSON export"
    end
    
    # Verify path edges exist in JSON
    (0...path.length-1).each do |i|
      from_vertex = path[i]
      to_vertex = path[i+1]
      
      edge_exists = json_data[:edges].any? do |edge|
        edge[:from] == from_vertex && edge[:to] == to_vertex
      end
      assert edge_exists, "Edge #{from_vertex}->#{to_vertex} from path should exist in JSON"
    end
  end

  def test_path_finding_with_d3_export
    # Test integration with D3 format export
    path = @complex_graph.shortest_path('A', 'F')
    
    d3_data = @complex_graph.to_d3_format
    
    # Verify all nodes in path exist in D3 format
    path.each do |vertex|
      node_exists = d3_data[:nodes].any? { |node| node[:id] == vertex }
      assert node_exists, "Node #{vertex} from path should exist in D3 export"
    end
    
    # Verify path links exist in D3 format
    (0...path.length-1).each do |i|
      from_vertex = path[i]
      to_vertex = path[i+1]
      
      link_exists = d3_data[:links].any? do |link|
        link[:source] == from_vertex && link[:target] == to_vertex
      end
      assert link_exists, "Link #{from_vertex}->#{to_vertex} from path should exist in D3 export"
    end
  end

  def test_multiple_shortest_paths_same_length
    # Create graph where multiple shortest paths exist
    # A -> B -> D
    # |         ^
    # v         |
    # C --------+
    multi_path_matrix = [
      [0, 1, 1, 0],  # A -> B, C
      [0, 0, 0, 1],  # B -> D
      [0, 0, 0, 1],  # C -> D  
      [0, 0, 0, 0]   # D
    ]
    multi_path_vertices = ['A', 'B', 'C', 'D']
    multi_path_graph = Graph.new(multi_path_matrix, multi_path_vertices)
    
    path = multi_path_graph.shortest_path('A', 'D')
    
    # Should find one of the two valid shortest paths
    valid_paths = [
      ['A', 'B', 'D'],
      ['A', 'C', 'D']
    ]
    assert_includes valid_paths, path
    assert_equal 3, path.length
  end

  def test_edge_cases_empty_graph
    empty_graph = Graph.new
    
    # Should handle empty graph gracefully
    path = empty_graph.shortest_path('A', 'B')
    assert_equal [], path
    
    path_undirected = empty_graph.shortest_path_undirected('A', 'B')
    assert_equal [], path_undirected
  end

  def test_single_vertex_graph
    single_matrix = [[0]]
    single_vertices = ['A']
    single_graph = Graph.new(single_matrix, single_vertices)
    
    # Path to self
    path = single_graph.shortest_path('A', 'A')
    assert_equal ['A'], path
    
    # Path to non-existent vertex
    path_invalid = single_graph.shortest_path('A', 'B')
    assert_equal [], path_invalid
  end
end

puts "Running Path Finding Tests..."
puts "=" * 50