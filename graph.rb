require 'json'
require 'csv'

class Graph
  attr_reader :matrix, :vertices

  def initialize(matrix = nil, vertices = nil)
    if matrix
      @matrix = matrix.map(&:dup)
      @vertices = vertices || (0...matrix.length).to_a
    else
      @matrix = []
      @vertices = []
    end
    validate_matrix
  end

  def add_vertex(vertex)
    return false if @vertices.include?(vertex)
    
    @vertices << vertex
    @matrix.each { |row| row << 0 }
    @matrix << Array.new(@vertices.length, 0)
    true
  end

  def remove_vertex(vertex)
    index = @vertices.index(vertex)
    return false unless index
    
    @vertices.delete_at(index)
    @matrix.delete_at(index)
    @matrix.each { |row| row.delete_at(index) }
    true
  end

  def add_edge(from, to, weight = 1)
    from_index = @vertices.index(from)
    to_index = @vertices.index(to)
    
    return false unless from_index && to_index
    
    @matrix[from_index][to_index] = weight
    true
  end

  def remove_edge(from, to)
    from_index = @vertices.index(from)
    to_index = @vertices.index(to)
    
    return false unless from_index && to_index
    
    @matrix[from_index][to_index] = 0
    true
  end

  def has_edge?(from, to)
    from_index = @vertices.index(from)
    to_index = @vertices.index(to)
    
    return false unless from_index && to_index
    
    @matrix[from_index][to_index] != 0
  end

  def get_neighbors(vertex)
    index = @vertices.index(vertex)
    return [] unless index
    
    neighbors = []
    @matrix[index].each_with_index do |weight, i|
      neighbors << @vertices[i] if weight != 0
    end
    neighbors
  end

  def dfs(start_vertex, visited = Set.new, &block)
    return [] unless @vertices.include?(start_vertex)
    return [] if visited.include?(start_vertex)
    
    visited.add(start_vertex)
    result = [start_vertex]
    block.call(start_vertex) if block_given?
    
    get_neighbors(start_vertex).each do |neighbor|
      result += dfs(neighbor, visited, &block)
    end
    
    result
  end

  def bfs(start_vertex, &block)
    return [] unless @vertices.include?(start_vertex)
    
    visited = Set.new
    queue = [start_vertex]
    result = []
    
    while !queue.empty?
      current = queue.shift
      next if visited.include?(current)
      
      visited.add(current)
      result << current
      block.call(current) if block_given?
      
      get_neighbors(current).each do |neighbor|
        queue << neighbor unless visited.include?(neighbor)
      end
    end
    
    result
  end

  def display_matrix
    puts "   #{@vertices.join('  ')}"
    @matrix.each_with_index do |row, i|
      puts "#{@vertices[i]}  #{row.join('  ')}"
    end
  end

  def visualize
    puts "\nGraph Visualization:"
    puts "=" * 50
    
    if @vertices.empty?
      puts "Empty graph"
      return
    end
    
    puts "Vertices: #{@vertices.join(', ')}"
    puts "\nEdges:"
    
    edges = []
    @matrix.each_with_index do |row, i|
      row.each_with_index do |weight, j|
        if weight != 0
          edge_str = weight == 1 ? "#{@vertices[i]} -> #{@vertices[j]}" : "#{@vertices[i]} --(#{weight})--> #{@vertices[j]}"
          edges << edge_str
        end
      end
    end
    
    if edges.empty?
      puts "  No edges"
    else
      edges.each { |edge| puts "  #{edge}" }
    end
    
    puts "\nAdjacency List:"
    @vertices.each do |vertex|
      neighbors = get_neighbors(vertex)
      if neighbors.empty?
        puts "  #{vertex}: (no connections)"
      else
        neighbor_strs = neighbors.map do |neighbor|
          from_idx = @vertices.index(vertex)
          to_idx = @vertices.index(neighbor)
          weight = @matrix[from_idx][to_idx]
          weight == 1 ? neighbor.to_s : "#{neighbor}(#{weight})"
        end
        puts "  #{vertex}: #{neighbor_strs.join(', ')}"
      end
    end
    
    puts "\nGraph Properties:"
    puts "  Vertices: #{@vertices.length}"
    puts "  Edges: #{edges.length}"
    puts "  Density: #{calculate_density.round(3)}"
    puts "=" * 50
  end

  def to_json_data
    nodes = @vertices.map.with_index do |vertex, index|
      {
        id: vertex.to_s,
        label: vertex.to_s,
        x: Math.cos(2 * Math::PI * index / @vertices.length) * 150 + 200,
        y: Math.sin(2 * Math::PI * index / @vertices.length) * 150 + 200
      }
    end
    
    edges = []
    @matrix.each_with_index do |row, i|
      row.each_with_index do |weight, j|
        if weight != 0
          edges << {
            from: @vertices[i].to_s,
            to: @vertices[j].to_s,
            weight: weight,
            label: weight == 1 ? "" : weight.to_s
          }
        end
      end
    end
    
    {
      nodes: nodes,
      edges: edges,
      properties: {
        vertices: @vertices.length,
        edges: edges.length,
        density: calculate_density.round(3)
      }
    }
  end

  def to_d3_format
    nodes = @vertices.map.with_index do |vertex, index|
      {
        id: vertex.to_s,
        name: vertex.to_s,
        category: "default"
      }
    end
    
    links = []
    @matrix.each_with_index do |row, i|
      row.each_with_index do |weight, j|
        if weight != 0
          links << {
            source: @vertices[i].to_s,
            target: @vertices[j].to_s,
            weight: weight
          }
        end
      end
    end
    
    {
      nodes: nodes,
      links: links
    }
  end

  def export_to_json(filename = "graph.json")
    File.write(filename, JSON.pretty_generate(to_json_data))
    puts "Graph exported to #{filename}"
  end

  def export_to_d3(filename = "graph_d3.json")
    File.write(filename, JSON.pretty_generate(to_d3_format))
    puts "Graph exported to D3.js format: #{filename}"
  end

  def self.from_file(filename, vertices = nil)
    unless File.exist?(filename)
      raise ArgumentError, "File '#{filename}' not found"
    end

    ext = File.extname(filename).downcase
    matrix = case ext
    when '.csv'
      load_csv_matrix(filename)
    when '.json'
      load_json_matrix(filename)
    when '.txt'
      load_text_matrix(filename)
    else
      load_text_matrix(filename)
    end

    new(matrix, vertices)
  end

  def self.from_string(matrix_string, vertices = nil)
    matrix = parse_matrix_string(matrix_string)
    new(matrix, vertices)
  end

  def to_s
    "Graph with #{@vertices.length} vertices: #{@vertices}"
  end

  private

  def self.load_csv_matrix(filename)
    matrix = []
    CSV.foreach(filename) do |row|
      matrix << row.map(&:to_i)
    end
    matrix
  end

  def self.load_json_matrix(filename)
    data = JSON.parse(File.read(filename))
    if data.is_a?(Hash) && data['matrix']
      data['matrix']
    elsif data.is_a?(Array)
      data
    else
      raise ArgumentError, "Invalid JSON format for matrix"
    end
  end

  def self.load_text_matrix(filename)
    lines = File.readlines(filename).map(&:strip).reject(&:empty?)
    matrix = []
    lines.each do |line|
      row = line.split(/[\s,]+/).map(&:to_i)
      matrix << row
    end
    matrix
  end

  def self.parse_matrix_string(matrix_string)
    lines = matrix_string.split(/[\r\n]+/).map(&:strip).reject(&:empty?)
    matrix = []
    lines.each do |line|
      row = line.split(/[\s,]+/).map(&:to_i)
      matrix << row
    end
    matrix
  end

  def calculate_density
    return 0.0 if @vertices.length <= 1
    
    edge_count = 0
    @matrix.each { |row| edge_count += row.count { |weight| weight != 0 } }
    
    max_edges = @vertices.length * (@vertices.length - 1)
    edge_count.to_f / max_edges
  end

  def validate_matrix
    return if @matrix.empty?
    
    raise ArgumentError, "Matrix must be square" unless @matrix.all? { |row| row.length == @matrix.length }
    raise ArgumentError, "Vertices count must match matrix size" if @vertices.length != @matrix.length
  end
end