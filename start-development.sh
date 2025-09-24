#!/bin/bash

echo "🚀 Starting PeakNorth Blog Automation Development Environment"
echo "=========================================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.template .env
    echo "⚠️  Please edit .env file with your Firebase configuration before continuing"
    echo "📖 See env.template for required values"
    exit 1
fi

echo "✅ Environment file found"

# Start frontend
echo "🎨 Starting frontend (React + Vite)..."
npm run dev &
FRONTEND_PID=$!

# Start backend
echo "🖥️  Starting backend (Node.js + Express)..."
cd server
npm run dev &
BACKEND_PID=$!
cd ..

echo ""
echo "✅ Development servers started!"
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:3001"
echo "📊 Health:   http://localhost:3001/health"
echo ""
echo "📋 Next steps:"
echo "1. Open http://localhost:5173 to access admin dashboard"
echo "2. Test the Create Post button"
echo "3. Set up n8n Cloud workflows (see N8N-SETUP.md)"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for interrupt
trap 'echo "🛑 Stopping servers..."; kill $FRONTEND_PID $BACKEND_PID; exit' INT
wait
