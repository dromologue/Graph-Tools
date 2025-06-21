#!/usr/bin/env node

/**
 * Interactive Heroku App Tester
 * 
 * Simple interactive tool to test your deployed Graph Tools app
 * and verify all functionality works correctly.
 */

const readline = require('readline');
const RemoteMCPTester = require('./test-remote-mcp');

class InteractiveHerokuTester {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async start() {
        console.log('🚀 Interactive Heroku App Tester');
        console.log('=================================');
        console.log('');
        console.log('This tool will help you test your deployed Graph Tools app');
        console.log('to ensure all features are working correctly on Heroku.');
        console.log('');

        try {
            // Get Heroku app URL
            const herokuUrl = await this.getHerokuUrl();
            
            // Validate URL format
            if (!this.isValidUrl(herokuUrl)) {
                console.log('❌ Invalid URL format. Please use: http://mcp.dromologue.com or https://your-app-name.herokuapp.com');
                process.exit(1);
            }

            console.log(`🌐 Testing app at: ${herokuUrl}`);
            console.log('');

            // Run the tests
            process.env.HEROKU_APP_URL = herokuUrl;
            const tester = new RemoteMCPTester();
            await tester.runTests();

            // Additional interactive tests
            await this.runInteractiveTests(herokuUrl);

        } catch (error) {
            console.error('❌ Test failed:', error.message);
        } finally {
            this.rl.close();
        }
    }

    async getHerokuUrl() {
        // Try to detect Heroku app automatically
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);

            console.log('🔍 Attempting to detect your Heroku app...');
            const result = await execAsync('heroku apps:info --json');
            const appInfo = JSON.parse(result.stdout);
            
            if (appInfo && appInfo.web_url) {
                console.log(`✅ Found Heroku app: ${appInfo.web_url}`);
                
                const useDetected = await this.ask(`Use detected URL ${appInfo.web_url}? (Y/n): `);
                if (!useDetected.toLowerCase().startsWith('n')) {
                    return appInfo.web_url.replace(/\/$/, ''); // Remove trailing slash
                }
            }
        } catch (error) {
            console.log('⚠️  Could not auto-detect Heroku app');
        }

        // Manual URL input
        return await this.ask('Enter your app URL (e.g., http://mcp.dromologue.com): ');
    }

    async runInteractiveTests(herokuUrl) {
        console.log('\n🎯 Interactive Feature Tests');
        console.log('=============================');

        // Test 1: Browser opening
        const shouldOpenBrowser = await this.ask('\n1. Would you like to open the app in your browser? (Y/n): ');
        if (!shouldOpenBrowser.toLowerCase().startsWith('n')) {
            await this.openInBrowser(herokuUrl);
        }

        // Test 2: Sample data test
        const shouldTestSample = await this.ask('\n2. Test sample data generation? (Y/n): ');
        if (!shouldTestSample.toLowerCase().startsWith('n')) {
            await this.testSampleDataInteractive(herokuUrl);
        }

        // Test 3: Visualizer test
        const shouldTestVisualizer = await this.ask('\n3. Test enhanced visualizer? (Y/n): ');
        if (!shouldTestVisualizer.toLowerCase().startsWith('n')) {
            await this.testVisualizerInteractive(herokuUrl);
        }

        console.log('\n🎉 Interactive testing completed!');
        console.log('\n💡 Next Steps:');
        console.log('   1. Test the app manually in your browser');
        console.log('   2. Try uploading a matrix file');
        console.log('   3. Test the Interactive Graph Visualizer button');
        console.log('   4. Verify centrality analysis features work');
        console.log('   5. Share the URL with others to test');
    }

    async openInBrowser(herokuUrl) {
        try {
            const { exec } = require('child_process');
            const platform = process.platform;
            
            let command;
            if (platform === 'darwin') {
                command = `open "${herokuUrl}"`;
            } else if (platform === 'win32') {
                command = `start "${herokuUrl}"`;
            } else if (platform === 'linux') {
                command = `xdg-open "${herokuUrl}"`;
            }
            
            if (command) {
                console.log('🌐 Opening app in browser...');
                exec(command);
                console.log('✅ Browser should open shortly');
                
                // Wait for user to test
                await this.ask('Press Enter after you\'ve tested the main page...');
            } else {
                console.log(`🌐 Please manually open: ${herokuUrl}`);
            }
        } catch (error) {
            console.log(`⚠️  Could not auto-open browser. Please visit: ${herokuUrl}`);
        }
    }

    async testSampleDataInteractive(herokuUrl) {
        console.log('\n📊 Testing sample data generation...');
        
        try {
            const RemoteMCPTester = require('./test-remote-mcp');
            const tester = new RemoteMCPTester();
            
            // Test different sample types
            const sampleTypes = ['social', 'dependency', 'basic'];
            
            for (const type of sampleTypes) {
                const response = await tester.makeRequest('/api/sample', 'POST', { type });
                
                if (response.statusCode === 200) {
                    const data = JSON.parse(response.body);
                    if (data.success) {
                        console.log(`  ✅ ${type} sample: ${data.graphData.nodes.length} nodes, ${data.graphData.edges?.length || data.graphData.links?.length || 0} edges`);
                    } else {
                        console.log(`  ❌ ${type} sample failed`);
                    }
                } else {
                    console.log(`  ❌ ${type} sample returned status ${response.statusCode}`);
                }
            }
            
            console.log('\n💡 You can test these manually by:');
            console.log('   1. Go to the main page');
            console.log('   2. Click "Social Network Sample", "Dependency Graph Sample", etc.');
            console.log('   3. Click "Open Interactive Visualization"');
            
        } catch (error) {
            console.log(`❌ Sample data test failed: ${error.message}`);
        }
    }

    async testVisualizerInteractive(herokuUrl) {
        console.log('\n🎨 Testing enhanced visualizer...');
        
        const visualizerUrl = `${herokuUrl}/visualizer`;
        console.log(`🌐 Visualizer URL: ${visualizerUrl}`);
        
        // Test if visualizer loads
        try {
            const RemoteMCPTester = require('./test-remote-mcp');
            const tester = new RemoteMCPTester();
            const response = await tester.makeRequest('/visualizer');
            
            if (response.statusCode === 200) {
                console.log('  ✅ Visualizer loads successfully');
                
                // Check for key features
                const features = [
                    { name: 'Text-based buttons', check: response.body.includes('>Degree<') },
                    { name: 'Centrality analysis', check: response.body.includes('runDegreeCentrality') },
                    { name: 'Auto-loading support', check: response.body.includes('updateStartNodeOptions') },
                    { name: 'Two-column layout', check: response.body.includes('grid-template-columns: 1fr 1fr') }
                ];
                
                features.forEach(feature => {
                    if (feature.check) {
                        console.log(`  ✅ ${feature.name} implemented`);
                    } else {
                        console.log(`  ❌ ${feature.name} missing`);
                    }
                });
            } else {
                console.log(`  ❌ Visualizer returned status ${response.statusCode}`);
            }
        } catch (error) {
            console.log(`❌ Visualizer test failed: ${error.message}`);
        }
        
        const shouldOpen = await this.ask('\nWould you like to open the visualizer in your browser? (Y/n): ');
        if (!shouldOpen.toLowerCase().startsWith('n')) {
            await this.openInBrowser(visualizerUrl);
            
            console.log('\n🧪 Manual testing checklist:');
            console.log('   □ Add nodes manually');
            console.log('   □ Test DFS/BFS operations');
            console.log('   □ Try centrality analysis (Degree, Between, Close, Eigen)');
            console.log('   □ Check start node dropdown populates');
            console.log('   □ Verify text-based buttons work');
            
            await this.ask('Press Enter after testing the visualizer...');
        }
    }

    isValidUrl(url) {
        try {
            new URL(url);
            return url.includes('herokuapp.com') || url.includes('dromologue.com') || url.includes('localhost') || url.includes('127.0.0.1');
        } catch {
            return false;
        }
    }

    ask(question) {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                resolve(answer.trim());
            });
        });
    }
}

// Run the interactive tester
if (require.main === module) {
    const tester = new InteractiveHerokuTester();
    tester.start().catch(console.error);
}