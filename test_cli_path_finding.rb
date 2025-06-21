#!/usr/bin/env ruby

require_relative 'graph_cli'
require 'test/unit'
require 'tempfile'
require 'stringio'

class TestCLIPathFinding < Test::Unit::TestCase
  
  def setup
    @cli = GraphCLI.new
    
    # Create test matrix file
    @test_matrix_content = "0,1,1,0\n1,0,0,1\n0,0,0,1\n0,0,1,0"
    @temp_file = Tempfile.new(['test_matrix', '.csv'])
    @temp_file.write(@test_matrix_content)
    @temp_file.close
  end
  
  def teardown
    @temp_file.unlink
  end

  def test_cli_shortest_path_found
    output = capture_output do
      @cli.run([@temp_file.path, '--vertices', 'A,B,C,D', '--path', 'A,D'])
    end
    
    assert_includes output, "Shortest path A -> D:"
    assert_includes output, "Path length:"
    # Should find path A -> B -> D
    assert_includes output, "A -> B -> D"
  end

  def test_cli_shortest_path_not_found
    # Create disconnected graph
    disconnected_content = "0,1,0,0\n1,0,0,0\n0,0,0,1\n0,0,1,0"
    Tempfile.create(['disconnected', '.csv']) do |file|
      file.write(disconnected_content)
      file.close
      
      output = capture_output do
        @cli.run([file.path, '--vertices', 'A,B,C,D', '--path', 'A,C'])
      end
      
      assert_includes output, "No path found from A to C"
    end
  end

  def test_cli_undirected_path_found
    output = capture_output do
      @cli.run([@temp_file.path, '--vertices', 'A,B,C,D', '--path-undirected', 'D,A'])
    end
    
    assert_includes output, "Shortest undirected path D -> A:"
    assert_includes output, "Path length:"
    # In undirected mode, should find a path
    assert_match(/D -> .* -> A/, output)
  end

  def test_cli_path_same_vertex
    output = capture_output do
      @cli.run([@temp_file.path, '--vertices', 'A,B,C,D', '--path', 'A,A'])
    end
    
    assert_includes output, "Shortest path A -> A: A"
    assert_includes output, "Path length: 0 edge(s)"
  end

  def test_cli_path_invalid_vertex
    output = capture_output do
      @cli.run([@temp_file.path, '--vertices', 'A,B,C,D', '--path', 'A,Z'])
    end
    
    # Should handle gracefully - CLI should show error for invalid vertex
    assert_includes output, "Graph Visualization:"  # CLI should still run
  end

  def test_cli_multiple_operations_with_path
    output = capture_output do
      @cli.run([
        @temp_file.path, 
        '--vertices', 'A,B,C,D',
        '--dfs', 'A',
        '--path', 'A,D',
        '--neighbors', 'B'
      ])
    end
    
    # Should contain all operation results
    assert_includes output, "DFS from A:"
    assert_includes output, "Shortest path A -> D:"
    assert_includes output, "Neighbors of B:"
  end

  def test_cli_edge_check_vs_path_finding
    output = capture_output do
      @cli.run([
        @temp_file.path,
        '--vertices', 'A,B,C,D', 
        '--edge', 'A,D',     # Should be No (no direct edge)
        '--path', 'A,D'      # Should find path through B
      ])
    end
    
    assert_includes output, "Edge A -> D: No"
    assert_includes output, "Shortest path A -> D: A -> B -> D"
  end

  def test_cli_path_finding_with_json_export
    Tempfile.create(['test_export', '.json']) do |json_file|
      output = capture_output do
        @cli.run([
          @temp_file.path,
          '--vertices', 'A,B,C,D',
          '--path', 'A,D',
          '--export-json', json_file.path
        ])
      end
      
      # Should show path result
      assert_includes output, "Shortest path A -> D:"
      
      # Should create JSON file
      assert File.exist?(json_file.path)
      
      # Verify JSON content
      json_content = JSON.parse(File.read(json_file.path))
      assert json_content.has_key?('nodes')
      assert json_content.has_key?('edges')
      
      # Verify path nodes exist in JSON
      path_nodes = ['A', 'B', 'D']
      path_nodes.each do |node|
        node_exists = json_content['nodes'].any? { |n| n['id'] == node }
        assert node_exists, "Node #{node} should exist in exported JSON"
      end
    end
  end

  def test_cli_complex_graph_path_finding
    # Create more complex graph for testing
    complex_content = "0,1,1,0,0,0\n0,0,0,1,1,0\n0,0,0,0,1,0\n0,0,0,0,0,1\n0,0,0,1,0,1\n0,0,0,0,0,0"
    Tempfile.create(['complex', '.csv']) do |file|
      file.write(complex_content)
      file.close
      
      output = capture_output do
        @cli.run([
          file.path,
          '--vertices', 'A,B,C,D,E,F',
          '--path', 'A,F'
        ])
      end
      
      assert_includes output, "Shortest path A -> F:"
      assert_includes output, "Path length: 3 edge(s)"
      # Should find one of the valid paths
      assert_match(/A -> (B -> (D|E) -> F|B -> E -> F)/, output)
    end
  end

  def test_cli_linear_graph_path_finding
    # Linear graph: A -> B -> C -> D
    linear_content = "0,1,0,0\n0,0,1,0\n0,0,0,1\n0,0,0,0"
    Tempfile.create(['linear', '.csv']) do |file|
      file.write(linear_content)
      file.close
      
      output = capture_output do
        @cli.run([
          file.path,
          '--vertices', 'A,B,C,D',
          '--path', 'A,D'
        ])
      end
      
      assert_includes output, "Shortest path A -> D: A -> B -> C -> D"
      assert_includes output, "Path length: 3 edge(s)"
    end
  end

  def test_cli_cycle_graph_path_finding
    # Cycle: A -> B -> C -> A
    cycle_content = "0,1,0\n0,0,1\n1,0,0"
    Tempfile.create(['cycle', '.csv']) do |file|
      file.write(cycle_content)
      file.close
      
      output = capture_output do
        @cli.run([
          file.path,
          '--vertices', 'A,B,C',
          '--path', 'A,C',
          '--path-undirected', 'C,A'
        ])
      end
      
      # Directed path should go around the cycle
      assert_includes output, "Shortest path A -> C: A -> B -> C"
      
      # Undirected path should be direct
      assert_includes output, "Shortest undirected path C -> A: C -> A"
    end
  end

  def test_cli_help_includes_path_options
    output = capture_output do
      @cli.run(['--help'])
    end
    
    assert_includes output, "--path FROM,TO"
    assert_includes output, "Find shortest path between vertices"
    assert_includes output, "--path-undirected FROM,TO"
    assert_includes output, "Find shortest path treating graph as undirected"
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
end

puts "Running CLI Path Finding Tests..."
puts "=" * 50