#!/bin/bash

echo "==================================="
echo "AI Tax CPA Agent - Startup Script"
echo "==================================="
echo ""

# Check if API key is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  Warning: ANTHROPIC_API_KEY not set"
    echo "Please set your API key:"
    echo "export ANTHROPIC_API_KEY=your_key_here"
    echo ""
fi

# Start backend
echo "Starting backend..."
cd backend
python main.py &
BACKEND_PID=$!
echo "Backend running on http://localhost:8000 (PID: $BACKEND_PID)"

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "Starting frontend..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend running on http://localhost:3000 (PID: $FRONTEND_PID)"

echo ""
echo "✅ Application started!"
echo "Open http://localhost:3000 in your browser"
echo ""
echo "To stop: kill $BACKEND_PID $FRONTEND_PID"

# Wait for user to press Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
