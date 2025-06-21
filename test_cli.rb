#!/usr/bin/env ruby

require 'test/unit'
require 'tempfile'
require 'json'

class TestGraphCLI < Test::Unit::TestCase
  
  def setup
    @cli_path = File.expand_path('graph_cli.rb', __dir__)
    @test_matrix_content = "0,1,1,0\n1,0,1,1\n1,1,0,1\n0,1,1,0"
    
    # Create temporary test files
    @temp_matrix = Tempfile.new(['test_matrix', '.csv'])
    @temp_matrix.write(@test_matrix_content)
    @temp_matrix.close
    
    @temp_output = Tempfile.new(['test_output', '.json'])
    @temp_output.close
  end
  
  def teardown
    @temp_matrix.unlink
    @temp_output.unlink
  end

  def test_cli_help
    output = run_cli(['-h'])
    assert_includes output, "Usage:"
    assert_includes output, "Load and visualize graphs"
    assert_includes output, "--vertices"
    assert_includes output, "--dfs"
    assert_includes output, "--bfs"
  end

  def test_cli_basic_visualization
    output = run_cli([@temp_matrix.path])
    
    assert_includes output, "Graph Visualization:"
    assert_includes output, "Vertices: 0, 1, 2, 3"
    assert_includes output, "Edges:"
    assert_includes output, "0 -> 1"
    assert_includes output, "Density:"
  end

  def test_cli_with_custom_vertices
    output = run_cli(['-v', 'A,B,C,D', @temp_matrix.path])
    
    assert_includes output, "Vertices: A, B, C, D"
    assert_includes output, "A -> B"
    assert_includes output, "B -> A"
  end

  def test_cli_dfs_operation
    output = run_cli(['--dfs', 'A', '-v', 'A,B,C,D', @temp_matrix.path])
    
    assert_includes output, "DFS from A:"
    assert_includes output, "A ->"
    # Should contain all connected vertices
    assert_includes output, "B"
    assert_includes output, "C"
    assert_includes output, "D"
  end

  def test_cli_bfs_operation
    output = run_cli(['--bfs', 'A', '-v', 'A,B,C,D', @temp_matrix.path])
    
    assert_includes output, "BFS from A:"
    assert_includes output, "A ->"
  end

  def test_cli_neighbors_operation
    output = run_cli(['--neighbors', 'A', '-v', 'A,B,C,D', @temp_matrix.path])
    
    assert_includes output, "Neighbors of A:"
    assert_includes output, "B, C"
  end

  def test_cli_edge_check
    output = run_cli(['--path', 'A,B', '-v', 'A,B,C,D', @temp_matrix.path])
    
    assert_includes output, "Edge A -> B: Yes"
  end

  def test_cli_json_export
    run_cli(['-j', @temp_output.path, @temp_matrix.path])
    
    assert File.exist?(@temp_output.path)
    
    content = File.read(@temp_output.path)
    parsed = JSON.parse(content)
    
    assert_instance_of Hash, parsed
    assert_has_key parsed, 'nodes'
    assert_has_key parsed, 'edges'
    assert_has_key parsed, 'properties'
    
    assert_equal 4, parsed['nodes'].length
    assert parsed['edges'].length > 0
  end

  def test_cli_matrix_format_output
    output = run_cli(['-f', 'matrix', @temp_matrix.path])
    
    assert_includes output, "   0  1  2  3"
    assert_includes output, "0  0  1  1  0"
    assert_includes output, "1  1  0  1  1"
  end

  def test_cli_json_format_output
    output = run_cli(['-f', 'json', @temp_matrix.path])
    
    # Should be valid JSON
    parsed = JSON.parse(output)
    assert_instance_of Hash, parsed
    assert_has_key parsed, 'nodes'
    assert_has_key parsed, 'edges'
  end

  def test_cli_invalid_vertex
    output = run_cli(['--dfs', 'Z', '-v', 'A,B,C,D', @temp_matrix.path])
    
    assert_includes output, "Error: Vertex 'Z' not found"
    assert_includes output, "Available vertices: A, B, C, D"
  end

  def test_cli_nonexistent_file
    output = run_cli(['nonexistent_file.csv'])
    
    # CLI attempts to parse as string when file doesn't exist
    assert_includes output, "Attempting to parse as matrix string"
    # The string parsing creates a minimal graph, so this is expected behavior
  end

  def test_cli_from_string_input
    # Test parsing matrix as string (when file doesn't exist)
    matrix_string = "0 1\n1 0"
    
    # This should attempt to parse as string and fail gracefully
    output = run_cli([matrix_string])
    assert_includes output, "Attempting to parse as matrix string"
  end

  def test_cli_multiple_operations
    output = run_cli([
      '--dfs', 'A', 
      '--bfs', 'B', 
      '--neighbors', 'C',
      '-v', 'A,B,C,D', 
      @temp_matrix.path
    ])
    
    assert_includes output, "DFS from A:"
    assert_includes output, "BFS from B:"
    assert_includes output, "Neighbors of C:"
  end

  def test_cli_d3_export
    # Create a temporary directory for D3 export test
    output = run_cli(['-d', @temp_matrix.path])
    
    assert_includes output, "D3.js visualization:"
    assert_includes output, "Graph data exported to"
    assert_includes output, "graph_d3_"
    assert_includes output, ".json"
  end

  def test_cli_web_export
    output = run_cli(['-w', @temp_matrix.path])
    
    assert_includes output, "Web visualization:"
    assert_includes output, "Graph data exported to"
    assert_includes output, "graph_"
    assert_includes output, ".json"
  end

  private

  def run_cli(args)
    cmd = ['ruby', @cli_path] + args
    # Use system() with array to properly handle spaces in paths
    require 'open3'
    result, status = Open3.capture2e(*cmd)
    result
  end

  def assert_has_key(hash, key)
    assert hash.has_key?(key), "Expected hash to have key #{key}"
  end
end

class TestGraphCLIFileFormats < Test::Unit::TestCase
  
  def setup
    @cli_path = File.expand_path('graph_cli.rb', __dir__)
  end

  def test_csv_file_loading
    Tempfile.create(['test', '.csv']) do |file|
      file.write("0,1,0\n1,0,1\n0,1,0")
      file.close
      
      output = run_cli([file.path])
      assert_includes output, "Graph Visualization:"
      assert_includes output, "Vertices: 3"
      assert_includes output, "Edges: 4"
    end
  end

  def test_txt_file_loading
    Tempfile.create(['test', '.txt']) do |file|
      file.write("0 1 0\n1 0 1\n0 1 0")
      file.close
      
      output = run_cli([file.path])
      assert_includes output, "Graph Visualization:"
    end
  end

  def test_json_file_loading
    Tempfile.create(['test', '.json']) do |file|
      json_data = {
        "matrix" => [
          [0, 1, 0],
          [1, 0, 1],
          [0, 1, 0]
        ]
      }
      file.write(json_data.to_json)
      file.close
      
      output = run_cli([file.path])
      assert_includes output, "Graph Visualization:"
    end
  end

  def test_mixed_separators_txt
    Tempfile.create(['test', '.txt']) do |file|
      file.write("0,1 0\n1 0,1\n0 1,0")  # Mixed comma and space
      file.close
      
      output = run_cli([file.path])
      assert_includes output, "Graph Visualization:"
    end
  end

  def test_invalid_matrix_format
    Tempfile.create(['test', '.csv']) do |file|
      file.write("0,1\n1,0,1")  # Invalid: inconsistent row sizes
      file.close
      
      output = run_cli([file.path])
      assert_includes output, "Error:"
    end
  end

  private

  def run_cli(args)
    cmd = ['ruby', @cli_path] + args
    # Use system() with array to properly handle spaces in paths
    require 'open3'
    result, status = Open3.capture2e(*cmd)
    result
  end
end

puts "Running CLI Tests..."
puts "=" * 50