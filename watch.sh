#!/bin/bash

# Simple wrapper script for the auto-deploy agent

echo "🚀 Starting Graph Tools Auto-Deploy Agent..."
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "auto-deploy-agent.js" ]; then
    echo "❌ auto-deploy-agent.js not found. Please run from the project root directory."
    exit 1
fi

# Run the agent
node auto-deploy-agent.js