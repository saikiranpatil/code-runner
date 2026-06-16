#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

# Array of Docker images extracted from your NestJS language strategies
IMAGES=(
  "node:20-alpine"
  "python:3.12-alpine"
  "gcc:13-bookworm"
  "eclipse-temurin:21-jdk"
)

echo "=================================================="
echo "🚀 Starting Code Runner Image Preload"
echo "=================================================="

# Check if Docker daemon is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Error: Docker daemon is not running. Please start Docker first."
  exit 1
fi

# Function to pull a single image safely
pull_image() {
  local img="$1"
  echo "📥 Pulling $img..."
  if docker pull "$img" > /dev/null 2>&1; then
    echo "✅ Successfully pulled $img"
  else
    echo "❌ Failed to pull $img"
    return 1
  fi
}

export -f pull_image

# Pull images in parallel to maximize network bandwidth
echo "⏳ Downloading images in parallel..."
printf "%s\n" "${IMAGES[@]}" | xargs -I {} -P ${#IMAGES[@]} bash -c 'pull_image "{}"'

echo ""
echo "=================================================="
echo "📊 Final Verification Status"
echo "=================================================="

# Verify all images are locally present
MISSING_COUNTER=0
for img in "${IMAGES[@]}"; do
  if [ "$(docker images -q "$img" 2> /dev/null)" == "" ]; then
    echo "❌ Missing: $img"
    MISSING_COUNTER=$((MISSING_COUNTER + 1))
  else
    echo "📦 Ready:   $img"
  fi
done

echo "=================================================="
if [ "$MISSING_COUNTER" -eq 0 ]; then
  echo "🎉 Success! All execution environments are ready."
  exit 0
else
  echo "⚠️ Warning: $MISSING_COUNTER image(s) failed to download. Please rerun the script."
  exit 1
fi