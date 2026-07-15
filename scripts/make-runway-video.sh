#!/bin/bash
# Create a short runway-style video from a single image using Ken Burns zoom
INPUT="$1"
OUTPUT="$2"
DURATION="${3:-6}"

ffmpeg -y -loop 1 -i "$INPUT" \
  -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0008,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$((DURATION*30)):s=1080x1920:fps=30" \
  -t "$DURATION" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "$OUTPUT" 2>/dev/null

echo "Created: $OUTPUT"