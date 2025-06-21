#!/usr/bin/env ruby

require 'test/unit'
require 'json'
require 'tempfile'
require 'net/http'
require 'open3'

class TestIntegration < Test::Unit::TestCase
  
  def setup
    @base_dir = File.dirname(__FILE__)
    @cli_path = File.join(@base_dir, 'graph_cli.rb')
    @mcp_dir = File.join(@base_dir, 'mcp-graph-server')
    @sample_data = [
      { 'id' => 'Alice', 'friends' => ['Bob', 'Carol'], 'department' => 'Engineering' },
      { 'id' => 'Bob', 'friends' => ['Alice', 'David'], 'department' => 'Marketing' },
      { 'id' => 'Carol', 'friends' => ['Alice', 'Eve'], 'department' => 'Engineering' },
      { 'id' => 'David', 'friends' => ['Bob'], 'department' => 'Sales' },
      { 'id' => 'Eve', 'friends' => ['Carol'], 'department' => 'Engineering' }
    ]
  end

  def test_end_to_end_data_flow
    # Test complete data flow: Raw data -> Graph analysis -> Visualization
    
    # Step 1: Create sample matrix from relationships
    matrix = create_matrix_from_data(@sample_data)
    
    # Step 2: Save to CSV file
    csv_file = create_temp_csv(matrix)
    
    # Step 3: Use CLI to analyze and export
    json_output_file = "#{csv_file.gsub('.csv', '')}_export.json"
    
    cli_command = [
      'ruby', @cli_path, 
      '-v', 'Alice,Bob,Carol,David,Eve',
      '-j', json_output_file,
      '--dfs', 'Alice',
      '--bfs', 'Bob', 
      csv_file
    ]
    
    output, status = run_command(cli_command)
    
    assert status.success?, "CLI command should succeed: #{output}"
    assert_includes output, "DFS from Alice:", "Should perform DFS"
    assert_includes output, "BFS from Bob:", "Should perform BFS"
    assert_includes output, "Graph exported to #{json_output_file}", "Should export JSON"
    
    # Step 4: Verify exported JSON structure
    assert File.exist?(json_output_file), "JSON file should be created"
    
    json_content = JSON.parse(File.read(json_output_file))
    assert_instance_of Hash, json_content
    assert_has_key json_content, 'nodes'
    assert_has_key json_content, 'edges'
    assert_has_key json_content, 'properties'
    
    assert_equal 5, json_content['nodes'].length
    assert json_content['edges'].length > 0
    
    # Step 5: Test D3.js export
    d3_command = [
      'ruby', @cli_path,
      '-v', 'Alice,Bob,Carol,David,Eve',
      '-d', csv_file
    ]
    
    d3_output, d3_status = run_command(d3_command)
    assert d3_status.success?, "D3 export should succeed"
    assert_includes d3_output, "D3.js visualization:", "Should mention D3 export"
    
    # Cleanup
    File.delete(csv_file) if File.exist?(csv_file)
    File.delete(json_output_file) if File.exist?(json_output_file)
  end

  def test_matrix_format_compatibility
    # Test that different matrix formats produce consistent results
    
    test_matrix = [
      [0, 1, 1, 0],
      [1, 0, 0, 1],
      [1, 0, 0, 1],
      [0, 1, 1, 0]
    ]
    
    vertices = ['A', 'B', 'C', 'D']
    
    # Test CSV format
    csv_file = create_temp_file('test.csv', test_matrix.map { |row| row.join(',') }.join("\n"))
    csv_output = run_cli_analysis(csv_file, vertices)
    
    # Test space-separated format
    txt_file = create_temp_file('test.txt', test_matrix.map { |row| row.join(' ') }.join("\n"))
    txt_output = run_cli_analysis(txt_file, vertices)
    
    # Test JSON format
    json_content = { 'matrix' => test_matrix }.to_json
    json_file = create_temp_file('test.json', json_content)
    json_output = run_cli_analysis(json_file, vertices)
    
    # All formats should produce same graph properties
    [csv_output, txt_output, json_output].each do |output|
      assert_includes output, "Vertices: 4"
      assert_includes output, "Edges: 6"
      assert_includes output, "A -> B"
      assert_includes output, "B -> A"
    end
    
    # Cleanup
    [csv_file, txt_file, json_file].each { |f| File.delete(f) if File.exist?(f) }
  end

  def test_graph_operations_consistency
    # Test that graph operations produce consistent results across different interfaces
    
    matrix = [
      [0, 1, 1],
      [1, 0, 1],
      [1, 1, 0]
    ]
    
    csv_file = create_temp_csv(matrix)
    vertices = ['X', 'Y', 'Z']
    
    # Test DFS from each vertex
    ['X', 'Y', 'Z'].each do |start_vertex|
      dfs_command = [
        'ruby', @cli_path,
        '-v', vertices.join(','),
        '--dfs', start_vertex,
        csv_file
      ]
      
      output, status = run_command(dfs_command)
      assert status.success?, "DFS from #{start_vertex} should succeed"
      assert_includes output, "DFS from #{start_vertex}:", "Should show DFS result"
      
      # In a complete graph, DFS should visit all vertices
      vertices.each do |vertex|
        assert_includes output, vertex, "DFS should visit #{vertex}"
      end
    end
    
    # Test BFS consistency
    bfs_command = [
      'ruby', @cli_path,
      '-v', vertices.join(','),
      '--bfs', 'X',
      csv_file
    ]
    
    output, status = run_command(bfs_command)
    assert status.success?, "BFS should succeed"
    assert_includes output, "BFS from X:", "Should show BFS result"
    
    File.delete(csv_file) if File.exist?(csv_file)
  end

  def test_web_visualization_pipeline
    # Test the complete pipeline for web visualization
    
    # Create a more complex graph
    complex_matrix = [
      [0, 1, 1, 0, 1],
      [1, 0, 0, 1, 0],
      [1, 0, 0, 1, 1],
      [0, 1, 1, 0, 0],
      [1, 0, 1, 0, 0]
    ]
    
    csv_file = create_temp_csv(complex_matrix)
    vertices = ['Hub', 'Node1', 'Node2', 'Node3', 'Node4']
    
    # Export for web visualization
    web_command = [
      'ruby', @cli_path,
      '-v', vertices.join(','),
      '-w', csv_file
    ]
    
    output, status = run_command(web_command)
    assert status.success?, "Web export should succeed"
    assert_includes output, "Web visualization:", "Should mention web export"
    assert_includes output, "graph_", "Should create graph file"
    
    # Find the generated file
    graph_files = Dir.glob("graph_*.json")
    assert graph_files.length > 0, "Should create at least one graph file"
    
    # Verify the web format
    latest_file = graph_files.max_by { |f| File.mtime(f) }
    web_data = JSON.parse(File.read(latest_file))
    
    assert_has_key web_data, 'nodes'
    assert_has_key web_data, 'edges'
    assert_has_key web_data, 'properties'
    
    # Check node structure for web format
    node = web_data['nodes'].first
    assert_has_key node, 'id'
    assert_has_key node, 'label'
    assert_has_key node, 'x'
    assert_has_key node, 'y'
    
    # Test D3 export format
    d3_command = [
      'ruby', @cli_path,
      '-v', vertices.join(','),
      '-d', csv_file
    ]
    
    d3_output, d3_status = run_command(d3_command)
    assert d3_status.success?, "D3 export should succeed"
    
    # Find D3 files
    d3_files = Dir.glob("graph_d3_*.json")
    assert d3_files.length > 0, "Should create D3 graph file"
    
    latest_d3 = d3_files.max_by { |f| File.mtime(f) }
    d3_data = JSON.parse(File.read(latest_d3))
    
    assert_has_key d3_data, 'nodes'
    assert_has_key d3_data, 'links'
    
    # Check D3 node structure
    d3_node = d3_data['nodes'].first
    assert_has_key d3_node, 'id'
    assert_has_key d3_node, 'name'
    assert_has_key d3_node, 'category'
    
    # Check D3 link structure
    d3_link = d3_data['links'].first
    assert_has_key d3_link, 'source'
    assert_has_key d3_link, 'target'
    assert_has_key d3_link, 'weight'
    
    # Cleanup
    [csv_file, latest_file, latest_d3].each { |f| File.delete(f) if File.exist?(f) }
  end

  def test_error_handling_integration
    # Test error handling across the entire pipeline
    
    # Test with malformed CSV
    malformed_csv = create_temp_file('malformed.csv', "0,1\n1,0,1")  # Inconsistent rows
    
    command = ['ruby', @cli_path, malformed_csv]
    output, status = run_command(command)
    
    assert !status.success?, "Should fail with malformed CSV"
    assert_includes output, "Error:", "Should show error message"
    
    # Test with non-existent vertex in operations
    good_csv = create_temp_csv([[0, 1], [1, 0]])
    
    invalid_vertex_command = [
      'ruby', @cli_path,
      '--dfs', 'NonExistent',
      '-v', 'A,B',
      good_csv
    ]
    
    output, status = run_command(invalid_vertex_command)
    assert status.success?, "CLI should succeed but show error for invalid vertex"
    assert_includes output, "Error: Vertex 'NonExistent' not found", "Should show vertex error"
    
    # Cleanup
    [malformed_csv, good_csv].each { |f| File.delete(f) if File.exist?(f) }
  end

  def test_performance_with_large_graph
    # Test performance with a larger graph
    size = 20
    large_matrix = Array.new(size) { Array.new(size, 0) }
    
    # Create a connected graph with some structure
    (0...size).each do |i|
      # Connect to next node (circular)
      large_matrix[i][(i + 1) % size] = 1
      large_matrix[(i + 1) % size][i] = 1
      
      # Add some random connections
      3.times do
        j = rand(size)
        if i != j
          large_matrix[i][j] = rand(1..3)
        end
      end
    end
    
    csv_file = create_temp_csv(large_matrix)
    vertices = (0...size).map { |i| "Node#{i}" }
    
    start_time = Time.now
    
    command = [
      'ruby', @cli_path,
      '-v', vertices.join(','),
      '--dfs', 'Node0',
      '--bfs', 'Node0',
      csv_file
    ]
    
    output, status = run_command(command)
    
    end_time = Time.now
    execution_time = end_time - start_time
    
    assert status.success?, "Large graph processing should succeed"
    assert execution_time < 5.0, "Should complete within 5 seconds, took #{execution_time}s"
    assert_includes output, "DFS from Node0:", "Should complete DFS"
    assert_includes output, "BFS from Node0:", "Should complete BFS"
    
    File.delete(csv_file) if File.exist?(csv_file)
  end

  private

  def create_matrix_from_data(data)
    # Convert relationship data to adjacency matrix
    vertices = data.map { |item| item['id'] }
    size = vertices.length
    matrix = Array.new(size) { Array.new(size, 0) }
    
    data.each_with_index do |person, i|
      if person['friends']
        person['friends'].each do |friend|
          j = vertices.index(friend)
          matrix[i][j] = 1 if j
        end
      end
    end
    
    matrix
  end

  def create_temp_csv(matrix)
    file = Tempfile.new(['test_matrix', '.csv'])
    csv_content = matrix.map { |row| row.join(',') }.join("\n")
    file.write(csv_content)
    file.close
    file.path
  end

  def create_temp_file(name, content)
    file = Tempfile.new(name)
    file.write(content)
    file.close
    file.path
  end

  def run_command(command)
    output, status = Open3.capture2e(*command)
    [output, status]
  end

  def run_cli_analysis(file_path, vertices)
    command = [
      'ruby', @cli_path,
      '-v', vertices.join(','),
      file_path
    ]
    
    output, status = run_command(command)
    assert status.success?, "CLI analysis should succeed for #{file_path}"
    output
  end

  def assert_has_key(hash, key)
    assert hash.has_key?(key), "Expected hash to have key #{key}"
  end
end

puts "Running Integration Tests..."
puts "=" * 50