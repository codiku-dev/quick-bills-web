#!/bin/bash

MODEL_NAME="google/gemma-3-12b"

echo "=== Starting AI Server Setup ==="
echo

# Check if model is already loaded
if lms ps | grep -q "$MODEL_NAME"; then
    echo "✅ Model already loaded"
else
    echo "📥 Model not loaded, downloading and loading..."
    lms get "$MODEL_NAME"
    lms load "$MODEL_NAME"
fi

# Start the server
echo "Starting LM Studio server..."
lms server start

# Show final status
echo
echo "=== Final Status ==="
lms status

echo
echo "✅ AI Server setup completed successfully!" 