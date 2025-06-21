#!/usr/bin/env ruby

require_relative 'graph'
require 'test/unit'
require 'json'
require 'tempfile'
require 'set'

class TestGraph < Test::Unit::TestCase
  
  def setup
    # Basic 3x3 matrix for testing
    @basic_matrix = [
      [0, 1, 1],
      [1, 0, 1], 
      [0, 1, 0]
    ]
    @basic_vertices = ['A', 'B', 'C']
    @graph = Graph.new(@basic_matrix, @basic_vertices)
    
    # Empty graph for testing dynamic operations
    @empty_graph = Graph.new
  end

  def test_initialization_with_matrix
    assert_equal @basic_matrix, @graph.matrix
    assert_equal @basic_vertices, @graph.vertices
  end

  def test_initialization_empty
    assert_equal [], @empty_graph.matrix
    assert_equal [], @empty_graph.vertices
  end

  def test_initialization_with_invalid_matrix
    invalid_matrix = [
      [0, 1],
      [1, 0, 1]  # Wrong size
    ]
    
    assert_raises(ArgumentError) do
      Graph.new(invalid_matrix, ['A', 'B'])
    end
  end

  def test_add_vertex
    initial_count = @empty_graph.vertices.length
    result = @empty_graph.add_vertex('X')
    
    assert_true result
    assert_equal initial_count + 1, @empty_graph.vertices.length
    assert_includes @empty_graph.vertices, 'X'
    
    # Test adding duplicate vertex
    duplicate_result = @empty_graph.add_vertex('X')
    assert_false duplicate_result
    assert_equal initial_count + 1, @empty_graph.vertices.length
  end

  def test_remove_vertex
    # Add some vertices first
    @empty_graph.add_vertex('X')
    @empty_graph.add_vertex('Y')
    @empty_graph.add_edge('X', 'Y')
    
    initial_count = @empty_graph.vertices.length
    result = @empty_graph.remove_vertex('X')
    
    assert_true result
    assert_equal initial_count - 1, @empty_graph.vertices.length
    assert_not_includes @empty_graph.vertices, 'X'
    
    # Check that edges involving removed vertex are also removed
    assert_false @empty_graph.has_edge?('X', 'Y')
    
    # Test removing non-existent vertex
    nonexistent_result = @empty_graph.remove_vertex('Z')
    assert_false nonexistent_result
  end

  def test_add_edge
    result = @graph.add_edge('A', 'C', 2)
    assert_true result
    assert_true @graph.has_edge?('A', 'C')
    
    # Test adding edge to non-existent vertex
    invalid_result = @graph.add_edge('A', 'Z')
    assert_false invalid_result
  end

  def test_remove_edge
    # Initially A->B exists
    assert_true @graph.has_edge?('A', 'B')
    
    result = @graph.remove_edge('A', 'B')
    assert_true result
    assert_false @graph.has_edge?('A', 'B')
    
    # Test removing non-existent edge
    invalid_result = @graph.remove_edge('A', 'Z')
    assert_false invalid_result
  end

  def test_has_edge
    assert_true @graph.has_edge?('A', 'B')
    assert_true @graph.has_edge?('B', 'A')
    assert_false @graph.has_edge?('A', 'A')
    assert_false @graph.has_edge?('C', 'A')
  end

  def test_get_neighbors
    neighbors_a = @graph.get_neighbors('A')
    expected_a = ['B', 'C']
    assert_equal expected_a.sort, neighbors_a.sort
    
    neighbors_c = @graph.get_neighbors('C')
    expected_c = ['B']
    assert_equal expected_c, neighbors_c
    
    # Test non-existent vertex
    neighbors_invalid = @graph.get_neighbors('Z')
    assert_equal [], neighbors_invalid
  end

  def test_dfs
    result = @graph.dfs('A')
    assert_includes result, 'A'
    assert_includes result, 'B'
    assert_includes result, 'C'
    assert_equal 3, result.length
    assert_equal 'A', result.first
    
    # Test with non-existent vertex
    empty_result = @graph.dfs('Z')
    assert_equal [], empty_result
  end

  def test_bfs
    result = @graph.bfs('A')
    assert_includes result, 'A'
    assert_includes result, 'B'
    assert_includes result, 'C'
    assert_equal 3, result.length
    assert_equal 'A', result.first
    
    # Test with non-existent vertex
    empty_result = @graph.bfs('Z')
    assert_equal [], empty_result
  end

  def test_to_json_data
    json_data = @graph.to_json_data
    
    assert_instance_of Hash, json_data
    assert_has_key json_data, :nodes
    assert_has_key json_data, :edges
    assert_has_key json_data, :properties
    
    assert_equal 3, json_data[:nodes].length
    assert_equal 5, json_data[:edges].length  # A->B, A->C, B->A, B->C, C->B
    
    # Check node structure
    node = json_data[:nodes].first
    assert_has_key node, :id
    assert_has_key node, :label
    assert_has_key node, :x
    assert_has_key node, :y
    
    # Check edge structure
    edge = json_data[:edges].first
    assert_has_key edge, :from
    assert_has_key edge, :to
    assert_has_key edge, :weight
  end

  def test_to_d3_format
    d3_data = @graph.to_d3_format
    
    assert_instance_of Hash, d3_data
    assert_has_key d3_data, :nodes
    assert_has_key d3_data, :links
    
    assert_equal 3, d3_data[:nodes].length
    assert_equal 5, d3_data[:links].length
    
    # Check node structure
    node = d3_data[:nodes].first
    assert_has_key node, :id
    assert_has_key node, :name
    assert_has_key node, :category
    
    # Check link structure
    link = d3_data[:links].first
    assert_has_key link, :source
    assert_has_key link, :target
    assert_has_key link, :weight
  end

  def test_export_to_json
    Tempfile.create(['test_graph', '.json']) do |file|
      @graph.export_to_json(file.path)
      
      assert File.exist?(file.path)
      
      content = File.read(file.path)
      parsed = JSON.parse(content)
      
      assert_instance_of Hash, parsed
      assert_has_key parsed, 'nodes'
      assert_has_key parsed, 'edges'
      assert_has_key parsed, 'properties'
    end
  end

  def test_export_to_d3
    Tempfile.create(['test_d3', '.json']) do |file|
      @graph.export_to_d3(file.path)
      
      assert File.exist?(file.path)
      
      content = File.read(file.path)
      parsed = JSON.parse(content)
      
      assert_instance_of Hash, parsed
      assert_has_key parsed, 'nodes'
      assert_has_key parsed, 'links'
    end
  end

  def test_from_file_csv
    Tempfile.create(['test_matrix', '.csv']) do |file|
      csv_content = "0,1,1\n1,0,1\n0,1,0"
      File.write(file.path, csv_content)
      
      graph = Graph.from_file(file.path, ['X', 'Y', 'Z'])
      
      assert_equal 3, graph.vertices.length
      assert_equal ['X', 'Y', 'Z'], graph.vertices
      assert_true graph.has_edge?('X', 'Y')
      assert_true graph.has_edge?('Y', 'X')
      assert_false graph.has_edge?('X', 'X')
    end
  end

  def test_from_file_text
    Tempfile.create(['test_matrix', '.txt']) do |file|
      text_content = "0 1 1\n1 0 1\n0 1 0"
      File.write(file.path, text_content)
      
      graph = Graph.from_file(file.path)
      
      assert_equal 3, graph.vertices.length
      assert_true graph.has_edge?(0, 1)
      assert_true graph.has_edge?(1, 0)
    end
  end

  def test_from_file_json
    Tempfile.create(['test_matrix', '.json']) do |file|
      json_content = {
        "matrix" => [[0, 1], [1, 0]]
      }.to_json
      File.write(file.path, json_content)
      
      graph = Graph.from_file(file.path)
      
      assert_equal 2, graph.vertices.length
      assert_true graph.has_edge?(0, 1)
      assert_true graph.has_edge?(1, 0)
    end
  end

  def test_from_string
    matrix_string = "0 1 1\n1 0 1\n0 1 0"
    graph = Graph.from_string(matrix_string, ['P', 'Q', 'R'])
    
    assert_equal 3, graph.vertices.length
    assert_equal ['P', 'Q', 'R'], graph.vertices
    assert_true graph.has_edge?('P', 'Q')
    assert_true graph.has_edge?('Q', 'P')
  end

  def test_density_calculation
    # For our 3-node graph with 5 edges (A->B, A->C, B->A, B->C, C->B)
    # Max edges = 3 * 2 = 6 (directed)
    # Density = 5/6 = 0.833
    density = @graph.send(:calculate_density)
    assert_in_delta 0.833, density, 0.001
    
    # Test empty graph
    empty_density = @empty_graph.send(:calculate_density)
    assert_equal 0.0, empty_density
  end

  def test_file_not_found
    assert_raises(ArgumentError) do
      Graph.from_file('nonexistent_file.csv')
    end
  end

  def test_visualize_output
    # Capture output
    output = capture_output { @graph.visualize }
    
    assert_includes output, "Graph Visualization:"
    assert_includes output, "Vertices: A, B, C"
    assert_includes output, "A -> B"
    assert_includes output, "Density:"
  end

  def test_display_matrix_output
    output = capture_output { @graph.display_matrix }
    
    assert_includes output, "A  B  C"
    assert_includes output, "A  0  1  1"
    assert_includes output, "B  1  0  1"
    assert_includes output, "C  0  1  0"
  end

  private

  def capture_output
    original_stdout = $stdout
    $stdout = StringIO.new
    yield
    $stdout.string
  ensure
    $stdout = original_stdout
  end

  def assert_has_key(hash, key)
    assert hash.has_key?(key), "Expected hash to have key #{key}"
  end
end

# Custom test for edge cases and performance
class TestGraphEdgeCases < Test::Unit::TestCase
  
  def test_large_graph_performance
    # Create a larger graph for performance testing
    size = 50
    matrix = Array.new(size) { Array.new(size, 0) }
    
    # Add some random edges
    (0...size).each do |i|
      (0...size).each do |j|
        matrix[i][j] = rand(0..1) if i != j && rand < 0.1
      end
    end
    
    vertices = (0...size).map { |i| "Node#{i}" }
    
    start_time = Time.now
    graph = Graph.new(matrix, vertices)
    creation_time = Time.now - start_time
    
    assert creation_time < 1.0, "Graph creation took too long: #{creation_time}s"
    
    # Test DFS performance
    start_time = Time.now
    result = graph.dfs('Node0')
    dfs_time = Time.now - start_time
    
    assert dfs_time < 1.0, "DFS took too long: #{dfs_time}s"
    assert result.length > 0
  end

  def test_weighted_edges
    graph = Graph.new
    graph.add_vertex('A')
    graph.add_vertex('B')
    graph.add_edge('A', 'B', 5)
    
    # Check that weight is preserved in exports
    json_data = graph.to_json_data
    edge = json_data[:edges].find { |e| e[:from] == 'A' && e[:to] == 'B' }
    assert_equal 5, edge[:weight]
    
    d3_data = graph.to_d3_format
    link = d3_data[:links].find { |l| l[:source] == 'A' && l[:target] == 'B' }
    assert_equal 5, link[:weight]
  end

  def test_self_loops
    graph = Graph.new
    graph.add_vertex('A')
    graph.add_edge('A', 'A', 1)
    
    assert graph.has_edge?('A', 'A')
    neighbors = graph.get_neighbors('A')
    assert_includes neighbors, 'A'
  end

  def test_disconnected_components
    # Create graph with disconnected components
    matrix = [
      [0, 1, 0, 0],
      [1, 0, 0, 0],
      [0, 0, 0, 1],
      [0, 0, 1, 0]
    ]
    vertices = ['A', 'B', 'C', 'D']
    graph = Graph.new(matrix, vertices)
    
    # DFS from A should only reach A and B
    dfs_result = graph.dfs('A')
    assert_includes dfs_result, 'A'
    assert_includes dfs_result, 'B'
    assert_not_includes dfs_result, 'C'
    assert_not_includes dfs_result, 'D'
    
    # DFS from C should only reach C and D
    dfs_result_c = graph.dfs('C')
    assert_includes dfs_result_c, 'C'
    assert_includes dfs_result_c, 'D'
    assert_not_includes dfs_result_c, 'A'
    assert_not_includes dfs_result_c, 'B'
  end
end

puts "Running Graph Tests..."
puts "=" * 50