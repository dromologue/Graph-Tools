# 🚀 Deploy Enhanced Graph Visualizer to Heroku

## Quick Deployment Steps

### 1. Prerequisites
- [Heroku account](https://heroku.com)
- [Heroku CLI installed](https://devcenter.heroku.com/articles/heroku-cli)
- Git repository

### 2. Login to Heroku
```bash
heroku login
```

### 3. Create Your Heroku App
```bash
# Create app with custom name
heroku create your-graph-visualizer-app

# Or let Heroku generate a name
heroku create
```

### 4. Configure Buildpacks
```bash
# Add Ruby buildpack for graph analysis
heroku buildpacks:add heroku/ruby

# Add Node.js buildpack for web server
heroku buildpacks:add heroku/nodejs
```

### 5. Deploy!
```bash
# Commit your changes first
git add .
git commit -m "Deploy enhanced graph visualizer"

# Push to Heroku
git push heroku main

# Open your live app
heroku open
```

## What You Get

### 🎨 Professional Interface
- **Left sidebar tool palette** with intuitive icons
- **Full-screen graph visualization** area
- **Sliding results panel** for analysis output
- **Responsive design** that adapts to screen size

### 📊 Powerful Features
- **4 Centrality Measures**: Degree, Betweenness, Closeness, Eigenvector
- **Interactive Node Collapsing**: Ctrl+Click and Shift+Click
- **Real-time Layout Controls**: Spacing and repulsion sliders  
- **Visual Algorithms**: DFS, BFS, and shortest path finding
- **Professional Tooltips**: Hover help for all tools

### 🌐 Web Access
Your app will be available at:
```
https://your-app-name.herokuapp.com
```

## Troubleshooting

### Check Logs
```bash
heroku logs --tail
```

### Restart App
```bash
heroku restart
```

### Check Status
```bash
heroku ps
```

## Local Testing

Before deploying, test locally:
```bash
npm install
npm start
# Visit http://localhost:3000
```

---

🎯 **Your professional graph analysis tool is now live on Heroku!**

Share the URL with colleagues for collaborative graph analysis and visualization.