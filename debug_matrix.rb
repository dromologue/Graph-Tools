matrix = [
  [0, 1, 1],
  [1, 0, 1], 
  [0, 1, 0]
]
vertices = ['A', 'B', 'C']

puts 'Matrix:'
matrix.each_with_index do |row, i|
  puts "#{vertices[i]}: #{row.join(' ')}"
end

puts "\nEdges:"
edges = []
matrix.each_with_index do |row, i|
  row.each_with_index do |weight, j|
    if weight != 0
      edges << "#{vertices[i]} -> #{vertices[j]}"
    end
  end
end
puts edges.join("\n")
puts "Total edges: #{edges.length}"

puts "\nDensity calculation:"
max_edges = vertices.length * (vertices.length - 1)
density = edges.length.to_f / max_edges
puts "Max edges: #{max_edges}"
puts "Actual edges: #{edges.length}"  
puts "Density: #{density}"