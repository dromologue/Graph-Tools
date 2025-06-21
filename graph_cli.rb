#!/usr/bin/env ruby

require_relative 'graph'
require 'optparse'
require 'set'

class GraphCLI
  def initialize
    @options = {
      vertices: nil,
      output_format: 'text',
      export_json: nil,
      export_web: false,
      operations: []
    }
  end

  def run(args)
    parser = create_option_parser
    parser.parse!(args)

    if args.empty?
      puts parser.help
      return
    end

    begin
      graph = load_graph(args[0])
      
      if @options[:vertices]
        vertex_labels = @options[:vertices].split(',')
        if vertex_labels.length != graph.vertices.length
          puts "Warning: Number of vertex labels (#{vertex_labels.length}) doesn't match matrix size (#{graph.vertices.length})"
          puts "Using default numeric labels"
        else
          graph.instance_variable_set(:@vertices, vertex_labels)
        end
      end

      display_graph_info(graph)
      perform_operations(graph)
      handle_exports(graph)

    rescue => e
      puts "Error: #{e.message}"
      exit 1
    end
  end

  private

  def create_option_parser
    OptionParser.new do |opts|
      opts.banner = "Usage: #{$0} [options] matrix_file"
      opts.separator ""
      opts.separator "Load and visualize graphs from adjacency matrices"
      opts.separator ""
      opts.separator "Supported formats:"
      opts.separator "  .csv - Comma-separated values"
      opts.separator "  .json - JSON array or {\"matrix\": [[...]]}"
      opts.separator "  .txt - Space/comma separated (default)"
      opts.separator ""
      opts.separator "Options:"

      opts.on("-v", "--vertices LABELS", "Comma-separated vertex labels (e.g., 'A,B,C,D')") do |v|
        @options[:vertices] = v
      end

      opts.on("-f", "--format FORMAT", ["text", "matrix", "json"], "Output format (text, matrix, json)") do |f|
        @options[:output_format] = f
      end

      opts.on("-j", "--export-json FILE", "Export graph to JSON file") do |f|
        @options[:export_json] = f
      end

      opts.on("-w", "--web", "Export for web visualization and open browser") do
        @options[:export_web] = true
      end

      opts.on("-d", "--d3", "Export for Enhanced Graph Visualizer and open browser") do
        @options[:export_d3] = true
      end

      opts.on("--dfs VERTEX", "Perform DFS traversal from vertex") do |v|
        @options[:operations] << [:dfs, v]
      end

      opts.on("--bfs VERTEX", "Perform BFS traversal from vertex") do |v|
        @options[:operations] << [:bfs, v]
      end

      opts.on("--neighbors VERTEX", "Show neighbors of vertex") do |v|
        @options[:operations] << [:neighbors, v]
      end

      opts.on("--path FROM,TO", "Check if edge exists between vertices") do |path|
        from, to = path.split(',')
        @options[:operations] << [:edge, from, to]
      end

      opts.on("-h", "--help", "Show this help message") do
        puts opts
        exit
      end

      opts.separator ""
      opts.separator "Examples:"
      opts.separator "  #{$0} matrix.txt"
      opts.separator "  #{$0} -v 'A,B,C,D' matrix.csv"
      opts.separator "  #{$0} --dfs A --bfs B matrix.txt"
      opts.separator "  #{$0} -w matrix.csv"
      opts.separator "  #{$0} -d matrix.csv"
      opts.separator ""
    end
  end

  def load_graph(input)
    if File.exist?(input)
      Graph.from_file(input, @options[:vertices]&.split(','))
    else
      puts "Attempting to parse as matrix string..."
      Graph.from_string(input, @options[:vertices]&.split(','))
    end
  end

  def display_graph_info(graph)
    case @options[:output_format]
    when 'json'
      puts JSON.pretty_generate(graph.to_json_data)
    when 'matrix'
      graph.display_matrix
    else
      graph.visualize
    end
  end

  def perform_operations(graph)
    @options[:operations].each do |op|
      case op[0]
      when :dfs
        vertex = find_vertex(graph, op[1])
        if vertex
          result = graph.dfs(vertex)
          puts "\nDFS from #{vertex}: #{result.join(' -> ')}"
        end
      when :bfs
        vertex = find_vertex(graph, op[1])
        if vertex
          result = graph.bfs(vertex)
          puts "\nBFS from #{vertex}: #{result.join(' -> ')}"
        end
      when :neighbors
        vertex = find_vertex(graph, op[1])
        if vertex
          neighbors = graph.get_neighbors(vertex)
          puts "\nNeighbors of #{vertex}: #{neighbors.join(', ')}"
        end
      when :edge
        from_vertex = find_vertex(graph, op[1])
        to_vertex = find_vertex(graph, op[2])
        if from_vertex && to_vertex
          has_edge = graph.has_edge?(from_vertex, to_vertex)
          puts "\nEdge #{from_vertex} -> #{to_vertex}: #{has_edge ? 'Yes' : 'No'}"
        end
      end
    end
  end

  def handle_exports(graph)
    if @options[:export_json]
      graph.export_to_json(@options[:export_json])
    end

    if @options[:export_web]
      web_filename = "graph_#{Time.now.to_i}.json"
      graph.export_to_json(web_filename)
      puts "\nWeb visualization:"
      puts "1. Graph data exported to #{web_filename}"
      puts "2. Opening graph-visualizer.html..."
      puts "3. Use 'Load Graph JSON' button to load #{web_filename}"
      
      system("open graph-visualizer.html") if RUBY_PLATFORM.include?('darwin')
    end

    if @options[:export_d3]
      d3_filename = "graph_d3_#{Time.now.to_i}.json"
      graph.export_to_d3(d3_filename)
      puts "\nEnhanced Graph Visualization:"
      puts "1. Graph data exported to #{d3_filename}"
      puts "2. Opening enhanced-graph-visualizer.html..."
      puts "3. Use 'Load JSON' button to load #{d3_filename}, or create new graphs interactively"
      puts "4. Run DFS/BFS operations with visual highlighting"
      
      system("open enhanced-graph-visualizer.html") if RUBY_PLATFORM.include?('darwin')
    end
  end

  def find_vertex(graph, vertex_input)
    vertex = graph.vertices.find { |v| v.to_s == vertex_input.to_s }
    unless vertex
      puts "Error: Vertex '#{vertex_input}' not found. Available vertices: #{graph.vertices.join(', ')}"
    end
    vertex
  end
end

if __FILE__ == $0
  cli = GraphCLI.new
  cli.run(ARGV)
end