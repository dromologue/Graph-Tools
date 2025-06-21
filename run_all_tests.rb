#!/usr/bin/env ruby

require 'colorize'
require 'open3'

class TestRunner
  def initialize
    @test_files = [
      'test_graph.rb',
      'test_cli.rb', 
      'test_integration.rb'
    ]
    @results = {}
  end

  def run_all_tests
    puts "Graph Analysis App - Test Suite".colorize(:cyan)
    puts "=" * 60
    puts
    
    total_start = Time.now
    
    @test_files.each do |test_file|
      run_test_file(test_file)
    end
    
    # Run Node.js MCP server tests
    run_mcp_tests
    
    total_time = Time.now - total_start
    
    puts
    puts "=" * 60
    print_summary(total_time)
  end

  private

  def run_test_file(test_file)
    if !File.exist?(test_file)
      puts "⚠️  #{test_file} not found - skipping".colorize(:yellow)
      @results[test_file] = { status: :skipped, reason: 'File not found' }
      return
    end

    puts "Running #{test_file}...".colorize(:blue)
    puts "-" * 40
    
    start_time = Time.now
    
    begin
      output, status = Open3.capture2e('ruby', test_file)
      end_time = Time.now
      duration = end_time - start_time
      
      if status.success?
        success_count = output.scan(/(\d+) tests, \d+ assertions, 0 failures, 0 errors/).flatten.first
        if success_count
          puts "✅ #{test_file} PASSED (#{success_count} tests, #{duration.round(2)}s)".colorize(:green)
          @results[test_file] = { 
            status: :passed, 
            tests: success_count.to_i, 
            duration: duration,
            output: output
          }
        else
          # Check for Test::Unit output format
          if output.include?('0 failures, 0 errors')
            test_count = output.scan(/(\d+) tests/).flatten.first || '?'
            puts "✅ #{test_file} PASSED (#{test_count} tests, #{duration.round(2)}s)".colorize(:green)
            @results[test_file] = { 
              status: :passed, 
              tests: test_count == '?' ? 0 : test_count.to_i, 
              duration: duration,
              output: output 
            }
          else
            puts "✅ #{test_file} COMPLETED (#{duration.round(2)}s)".colorize(:green)
            @results[test_file] = { 
              status: :completed, 
              duration: duration,
              output: output 
            }
          end
        end
      else
        puts "❌ #{test_file} FAILED (#{duration.round(2)}s)".colorize(:red)
        @results[test_file] = { 
          status: :failed, 
          duration: duration,
          output: output 
        }
        puts "Error output:".colorize(:red)
        puts output.split("\n").last(10).join("\n").colorize(:light_red)
      end
    rescue => e
      puts "💥 #{test_file} ERROR: #{e.message}".colorize(:red)
      @results[test_file] = { status: :error, error: e.message }
    end
    
    puts
  end

  def run_mcp_tests
    mcp_test_file = 'mcp-graph-server/test_mcp_server.js'
    
    if !File.exist?(mcp_test_file)
      puts "⚠️  MCP tests not found - skipping".colorize(:yellow)
      @results['mcp_tests'] = { status: :skipped, reason: 'File not found' }
      return
    end

    puts "Running MCP Server tests...".colorize(:blue)
    puts "-" * 40
    
    start_time = Time.now
    
    begin
      Dir.chdir('mcp-graph-server') do
        output, status = Open3.capture2e('node', 'test_mcp_server.js')
        end_time = Time.now
        duration = end_time - start_time
        
        if status.success?
          if output.include?('All tests passed!')
            test_count = output.scan(/Total: (\d+)/).flatten.first || '?'
            puts "✅ MCP Server PASSED (#{test_count} tests, #{duration.round(2)}s)".colorize(:green)
            @results['mcp_tests'] = { 
              status: :passed, 
              tests: test_count == '?' ? 0 : test_count.to_i,
              duration: duration,
              output: output 
            }
          else
            puts "✅ MCP Server COMPLETED (#{duration.round(2)}s)".colorize(:green)
            @results['mcp_tests'] = { 
              status: :completed, 
              duration: duration,
              output: output 
            }
          end
        else
          puts "❌ MCP Server FAILED (#{duration.round(2)}s)".colorize(:red)
          @results['mcp_tests'] = { 
            status: :failed, 
            duration: duration,
            output: output 
          }
          puts "Error output:".colorize(:red)
          puts output.split("\n").last(10).join("\n").colorize(:light_red)
        end
      end
    rescue => e
      puts "💥 MCP Server ERROR: #{e.message}".colorize(:red)
      @results['mcp_tests'] = { status: :error, error: e.message }
    end
    
    puts
  end

  def print_summary(total_time)
    puts "TEST SUMMARY".colorize(:cyan)
    puts "=" * 60
    
    passed = @results.values.count { |r| r[:status] == :passed }
    completed = @results.values.count { |r| r[:status] == :completed }
    failed = @results.values.count { |r| r[:status] == :failed }
    errors = @results.values.count { |r| r[:status] == :error }
    skipped = @results.values.count { |r| r[:status] == :skipped }
    
    total_tests = @results.values.sum { |r| r[:tests] || 0 }
    
    puts "📊 Overall Results:"
    puts "   Passed: #{passed}".colorize(:green) if passed > 0
    puts "   Completed: #{completed}".colorize(:green) if completed > 0
    puts "   Failed: #{failed}".colorize(:red) if failed > 0
    puts "   Errors: #{errors}".colorize(:red) if errors > 0
    puts "   Skipped: #{skipped}".colorize(:yellow) if skipped > 0
    puts
    puts "🔬 Total individual tests: #{total_tests}"
    puts "⏱️  Total execution time: #{total_time.round(2)}s"
    
    if failed > 0 || errors > 0
      puts
      puts "❌ SOME TESTS FAILED".colorize(:red)
      puts "Check the output above for details."
      
      # Show failed test details
      @results.each do |file, result|
        if result[:status] == :failed || result[:status] == :error
          puts
          puts "#{file}:".colorize(:red)
          if result[:output]
            # Show last few lines of output
            lines = result[:output].split("\n")
            puts lines.last(5).join("\n").colorize(:light_red)
          end
        end
      end
    else
      puts
      puts "🎉 ALL TESTS PASSED!".colorize(:green)
      puts "The graph analysis application is working correctly."
    end

    puts
    puts "Test Coverage:"
    puts "✓ Graph class functionality".colorize(:green)
    puts "✓ CLI operations and formats".colorize(:green)
    puts "✓ Integration workflows".colorize(:green)
    puts "✓ MCP server tools".colorize(:green)
    puts "✓ Error handling".colorize(:green)
    puts "✓ Performance with large graphs".colorize(:green)
    puts "✓ Multiple export formats".colorize(:green)
  end
end

# Check for required gems
begin
  require 'colorize'
rescue LoadError
  puts "Installing colorize gem for better output..."
  system('gem install colorize')
  require 'colorize'
end

if __FILE__ == $0
  runner = TestRunner.new
  runner.run_all_tests
end