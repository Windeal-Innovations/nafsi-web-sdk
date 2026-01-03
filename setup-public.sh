#!/bin/sh
# Setup script to create public directory structure and symbolic links

set -e

echo "Setting up public directory structure..."

# Create public/v1 directory
mkdir -p public/v1

# Create symbolic links to dist files
cd public/v1
ln -sf ../../dist/nafsi.js nafsi.js
ln -sf ../../dist/nafsi.js.map nafsi.js.map

echo "✅ Symbolic links created:"
ls -lh

echo "✅ Public directory setup complete!"
