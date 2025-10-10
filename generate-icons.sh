#!/bin/bash

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "Installing ImageMagick..."
    sudo apt update && sudo apt install imagemagick -y
fi

# Create icon directories
mkdir -p android/app/src/main/res/mipmap-hdpi
mkdir -p android/app/src/main/res/mipmap-mdpi
mkdir -p android/app/src/main/res/mipmap-xhdpi
mkdir -p android/app/src/main/res/mipmap-xxhdpi
mkdir -p android/app/src/main/res/mipmap-xxxhdpi

# Generate icons in different sizes
echo "Generating app icons..."

# Convert SVG to PNG with different sizes
convert app-icon.svg -resize 72x72 android/app/src/main/res/mipmap-mdpi/ic_launcher.png
convert app-icon.svg -resize 72x72 android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png
convert app-icon.svg -resize 72x72 android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png

convert app-icon.svg -resize 96x96 android/app/src/main/res/mipmap-hdpi/ic_launcher.png
convert app-icon.svg -resize 96x96 android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png
convert app-icon.svg -resize 96x96 android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png

convert app-icon.svg -resize 144x144 android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
convert app-icon.svg -resize 144x144 android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png
convert app-icon.svg -resize 144x144 android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png

convert app-icon.svg -resize 192x192 android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
convert app-icon.svg -resize 192x192 android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png
convert app-icon.svg -resize 192x192 android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png

convert app-icon.svg -resize 288x288 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
convert app-icon.svg -resize 288x288 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png
convert app-icon.svg -resize 288x288 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png

echo "✅ App icons generated successfully!"
echo "Generated icons for all density levels:"
echo "- mdpi (72x72)"
echo "- hdpi (96x96)" 
echo "- xhdpi (144x144)"
echo "- xxhdpi (192x192)"
echo "- xxxhdpi (288x288)"
