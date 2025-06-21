# Heroku Deployment Guide

## 🚀 Deploy Graph Tools to Heroku

This guide will help you deploy the Graph Tools application to Heroku, making it accessible as a web application.

## Prerequisites

1. **Heroku Account** - Sign up at [heroku.com](https://heroku.com)
2. **Heroku CLI** - Install from [devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)
3. **Git repository** - Your code should already be in a Git repository

## Deployment Steps

### 1. Login to Heroku
```bash
heroku login
```

### 2. Create Heroku Application
```bash
# Create a new Heroku app (replace 'your-app-name' with desired name)
heroku create your-graph-tools-app

# Or let Heroku generate a name
heroku create
```

### 3. Configure Buildpacks
```bash
# Add Ruby buildpack (for the graph analysis backend)
heroku buildpacks:add heroku/ruby

# Add Node.js buildpack (for the web server)
heroku buildpacks:add heroku/nodejs
```

### 4. Deploy the Application
```bash
# Push to Heroku
git push heroku main

# If you're on a different branch:
git push heroku your-branch:main
```

### 5. Open Your Application
```bash
heroku open
```

## Application Features

### 🌐 Web Interface
- **URL**: `https://your-app-name.herokuapp.com`
- **Upload matrices** via drag-and-drop or file picker
- **Sample data** for quick testing
- **Real-time analysis** with Ruby backend
- **Interactive visualizations** with D3.js

### 📊 Supported Formats
- **CSV** - Comma-separated adjacency matrices
- **JSON** - Structured node/edge format
- **TXT** - Space or comma-separated matrices

### 🔍 Graph Operations
- **Basic Analysis** - Graph statistics and structure
- **DFS Traversal** - Depth-first search with path highlighting
- **BFS Traversal** - Breadth-first search with visual feedback
- **Neighbor Analysis** - Find connected nodes

## Configuration

### Environment Variables
The app uses these environment variables (automatically set by Heroku):
- `PORT` - Server port (set by Heroku)
- `NODE_ENV` - Environment mode (production)

### Ruby Version
- The app uses **Ruby 3.1.0** as specified in the Gemfile
- Heroku will automatically install the correct Ruby version

### Node.js Version
- Requires **Node.js 16+** as specified in package.json
- Heroku will use the latest compatible version

## Troubleshooting

### Build Issues
```bash
# Check build logs
heroku logs --tail

# Check buildpack detection
heroku buildpacks
```

### Runtime Issues
```bash
# View application logs
heroku logs --tail

# Restart the application
heroku restart

# Check dyno status
heroku ps
```

### File Upload Issues
- Heroku has an **ephemeral filesystem**
- Uploaded files are temporary and cleared on dyno restart
- This is expected behavior for the demo application

## Local Development

### Run Locally
```bash
# Install dependencies
npm install

# Start the web server
npm start

# Or use development mode with auto-restart
npm run dev
```

### Test CLI Directly
```bash
# Run Ruby CLI commands directly
ruby graph_cli.rb sample_matrix.csv

# Test with visualization
ruby graph_cli.rb -d sample_matrix.csv
```

## Application Architecture

### Frontend
- **HTML/CSS/JavaScript** - Modern web interface
- **File Upload** - Drag-and-drop and traditional upload
- **Real-time Results** - AJAX communication with backend

### Backend
- **Node.js/Express** - Web server and API endpoints
- **Ruby CLI** - Graph analysis engine
- **File Processing** - Matrix parsing and validation

### Visualization
- **D3.js Force Layout** - Interactive graph visualization
- **Algorithm Highlighting** - Visual DFS/BFS demonstrations
- **Export Capabilities** - Download results as CSV/JSON

## Security Notes

- File uploads are temporary and automatically cleaned up
- No persistent data storage (suitable for demo/analysis use)
- All processing happens server-side for security
- Input validation on both client and server sides

## Scaling Considerations

### For Production Use:
1. **Add Database** - PostgreSQL for persistent storage
2. **File Storage** - AWS S3 or similar for file persistence  
3. **Authentication** - User accounts and session management
4. **Rate Limiting** - Prevent abuse of analysis endpoints
5. **Monitoring** - Application performance monitoring

## Cost Optimization

### Free Tier Usage:
- Uses **Eco dynos** (sleeps after 30 min of inactivity)
- Suitable for demos and light usage
- No additional add-ons required

### For Higher Usage:
- Upgrade to **Basic or Standard dynos**
- Consider **Hobby PostgreSQL** for data persistence
- Monitor **dyno hours** usage

---

🎯 **Your Graph Tools application is now live on Heroku!**

Visit your deployed application and start analyzing graphs with the interactive web interface.