#!/usr/bin/env node

/**
 * Auto-Deploy Agent for Graph Tools
 * 
 * Watches for file changes in the codebase, asks for permission to commit,
 * and automatically redeploys to Heroku when changes are detected.
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const readline = require('readline');
const chokidar = require('chokidar');

class AutoDeployAgent {
    constructor() {
        this.isProcessing = false;
        this.changeQueue = new Set();
        this.debounceTimer = null;
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        // Configuration
        this.config = {
            watchPaths: [
                'server.js',
                'public/**/*',
                'Files/**/*',
                'mcp-graph-server/**/*',
                'package.json',
                'Procfile',
                'app.json'
            ],
            ignorePaths: [
                'node_modules/**',
                '.git/**',
                'uploads/**',
                'mcp-graph-server/data/**',
                '**/*.log',
                '**/.DS_Store',
                '**/tmp/**'
            ],
            debounceDelay: 3000, // 3 seconds
            herokuApp: process.env.HEROKU_APP_NAME || null
        };
        
        console.log('🤖 Auto-Deploy Agent for Graph Tools');
        console.log('=====================================');
        console.log('👁️  Watching for changes...');
        console.log('⚡ Will ask for permission before committing');
        console.log('🚀 Will auto-deploy to Heroku after commits');
        console.log('');
    }

    async init() {
        // Check prerequisites
        await this.checkPrerequisites();
        
        // Setup file watcher
        this.setupWatcher();
        
        // Setup graceful shutdown
        this.setupShutdown();
        
        console.log('✅ Auto-Deploy Agent is now active!');
        console.log('📝 Make changes to your code and I\'ll handle the rest...\n');
    }

    async checkPrerequisites() {
        console.log('🔍 Checking prerequisites...');
        
        // Check if we're in a git repository
        try {
            await this.execAsync('git status');
            console.log('  ✅ Git repository detected');
        } catch (error) {
            console.error('  ❌ Not in a git repository. Please run from project root.');
            process.exit(1);
        }
        
        // Check Heroku CLI
        try {
            await this.execAsync('heroku --version');
            console.log('  ✅ Heroku CLI available');
        } catch (error) {
            console.error('  ❌ Heroku CLI not found. Please install: npm install -g heroku');
            process.exit(1);
        }
        
        // Check Heroku app configuration
        if (!this.config.herokuApp) {
            try {
                const result = await this.execAsync('heroku apps:info --json');
                const appInfo = JSON.parse(result.stdout);
                this.config.herokuApp = appInfo.name;
                console.log(`  ✅ Heroku app detected: ${this.config.herokuApp}`);
            } catch (error) {
                console.log('  ⚠️  No Heroku app configured. Will skip deployment.');
            }
        } else {
            console.log(`  ✅ Heroku app configured: ${this.config.herokuApp}`);
        }
        
        console.log('');
    }

    setupWatcher() {
        // Initialize file watcher
        const watcher = chokidar.watch(this.config.watchPaths, {
            ignored: this.config.ignorePaths,
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 1000,
                pollInterval: 100
            }
        });

        // Handle file changes
        watcher.on('change', (filePath) => this.handleFileChange(filePath, 'modified'));
        watcher.on('add', (filePath) => this.handleFileChange(filePath, 'added'));
        watcher.on('unlink', (filePath) => this.handleFileChange(filePath, 'deleted'));
        
        watcher.on('error', (error) => {
            console.error('👁️  Watcher error:', error);
        });

        this.watcher = watcher;
    }

    handleFileChange(filePath, changeType) {
        if (this.isProcessing) return;
        
        console.log(`📝 ${changeType.toUpperCase()}: ${filePath}`);
        this.changeQueue.add({ filePath, changeType, timestamp: Date.now() });
        
        // Debounce multiple rapid changes
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.processChanges();
        }, this.config.debounceDelay);
    }

    async processChanges() {
        if (this.isProcessing || this.changeQueue.size === 0) return;
        
        this.isProcessing = true;
        const changes = Array.from(this.changeQueue);
        this.changeQueue.clear();
        
        console.log('\n🔄 Processing changes...');
        console.log(`📊 ${changes.length} file(s) changed in the last ${this.config.debounceDelay/1000} seconds`);
        
        try {
            // Check git status
            const gitStatus = await this.execAsync('git status --porcelain');
            
            if (!gitStatus.stdout.trim()) {
                console.log('ℹ️  No git changes detected, skipping...\n');
                this.isProcessing = false;
                return;
            }
            
            // Show changes
            console.log('\n📋 Git status:');
            console.log(gitStatus.stdout);
            
            // Ask for permission to commit
            const shouldCommit = await this.askForPermission();
            
            if (shouldCommit) {
                await this.commitAndDeploy(changes);
            } else {
                console.log('⏭️  Skipping commit and deployment\n');
            }
            
        } catch (error) {
            console.error('❌ Error processing changes:', error.message);
        }
        
        this.isProcessing = false;
    }

    async askForPermission() {
        return new Promise((resolve) => {
            this.rl.question('\n🤖 Would you like me to commit these changes and deploy? (y/N): ', (answer) => {
                const shouldCommit = answer.toLowerCase().startsWith('y');
                resolve(shouldCommit);
            });
        });
    }

    async commitAndDeploy(changes) {
        try {
            console.log('\n📦 Staging changes...');
            await this.execAsync('git add .');
            
            // Generate commit message
            const commitMessage = this.generateCommitMessage(changes);
            console.log(`💬 Commit message: "${commitMessage}"`);
            
            // Commit changes
            console.log('📝 Committing changes...');
            await this.execAsync(`git commit -m "${commitMessage}"`);
            console.log('✅ Changes committed successfully');
            
            // Deploy to Heroku if configured
            if (this.config.herokuApp) {
                console.log('\n🚀 Deploying to Heroku...');
                
                const deployResult = await this.execAsync('git push heroku main', { timeout: 120000 });
                console.log('✅ Deployment successful!');
                
                // Get app URL
                try {
                    const appInfo = await this.execAsync('heroku apps:info --json');
                    const info = JSON.parse(appInfo.stdout);
                    console.log(`🌐 App URL: ${info.web_url}`);
                } catch (error) {
                    console.log(`🌐 App URL: https://${this.config.herokuApp}.herokuapp.com/`);
                }
            } else {
                console.log('⏭️  Skipping Heroku deployment (not configured)');
            }
            
            console.log('\n🎉 Auto-deployment completed successfully!\n');
            
        } catch (error) {
            console.error('❌ Deployment failed:', error.message);
            
            if (error.message.includes('git push')) {
                console.log('💡 Tip: Check Heroku logs with: heroku logs --tail');
            }
        }
    }

    generateCommitMessage(changes) {
        const fileTypes = this.categorizeChanges(changes);
        const timestamp = new Date().toISOString().split('T')[0];
        
        // Generate appropriate commit message based on changed files
        if (fileTypes.ui && fileTypes.server) {
            return `Update UI and server functionality - ${timestamp}`;
        } else if (fileTypes.ui) {
            return `Update user interface and visualizations - ${timestamp}`;
        } else if (fileTypes.server) {
            return `Update server functionality and APIs - ${timestamp}`;
        } else if (fileTypes.mcp) {
            return `Update MCP server functionality - ${timestamp}`;
        } else if (fileTypes.config) {
            return `Update configuration and deployment settings - ${timestamp}`;
        } else {
            return `Auto-commit: Update graph tools functionality - ${timestamp}`;
        }
    }

    categorizeChanges(changes) {
        const categories = {
            ui: false,
            server: false,
            mcp: false,
            config: false
        };
        
        changes.forEach(change => {
            const filePath = change.filePath;
            
            if (filePath.includes('Files/') || filePath.includes('public/')) {
                categories.ui = true;
            }
            if (filePath.includes('server.js')) {
                categories.server = true;
            }
            if (filePath.includes('mcp-graph-server/')) {
                categories.mcp = true;
            }
            if (filePath.includes('package.json') || filePath.includes('Procfile') || filePath.includes('app.json')) {
                categories.config = true;
            }
        });
        
        return categories;
    }

    setupShutdown() {
        const shutdown = () => {
            console.log('\n\n🛑 Shutting down Auto-Deploy Agent...');
            
            if (this.watcher) {
                this.watcher.close();
            }
            
            if (this.rl) {
                this.rl.close();
            }
            
            console.log('👋 Auto-Deploy Agent stopped');
            process.exit(0);
        };
        
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    }

    execAsync(command, options = {}) {
        return new Promise((resolve, reject) => {
            const timeout = options.timeout || 30000;
            
            exec(command, { timeout }, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({ stdout, stderr });
                }
            });
        });
    }
}

// Check if chokidar is installed
try {
    require.resolve('chokidar');
} catch (error) {
    console.error('❌ Missing dependency: chokidar');
    console.error('📦 Please install it with: npm install chokidar');
    process.exit(1);
}

// Run the agent
const agent = new AutoDeployAgent();
agent.init().catch(console.error);