#!/bin/bash
set -e

PROJECT_NAME="ClickBox"
BUNDLE_ID="com.mycompany.clicbox"
SKU="TT353XSV23"
APPLE_APP_ID="6758314176"

echo "=========================================================="
echo " ClickBox: Convertidor Safari Web Extension para Mac/iOS "
echo "=========================================================="
echo "Host App Bundle ID:       $BUNDLE_ID"
echo "Extension Bundle ID:      $BUNDLE_ID.Extension"
echo "SKU:                      $SKU"
echo "Apple ID App:             $APPLE_APP_ID"
echo "=========================================================="

if ! command -v xcrun &> /dev/null; then
    echo "❌ Error: Este script requiere macOS con Xcode instalado (Command Line Tools)."
    echo "ℹ️  Si estás en Windows, sube los cambios a GitHub y el workflow de GitHub Actions"
    echo "    se encargará de compilar el proyecto en macOS automáticamente."
    exit 1
fi

echo "⚙️  Convirtiendo extensión web a proyecto nativo de Xcode..."
xcrun safari-web-extension-converter . \
    --project-name "$PROJECT_NAME" \
    --bundle-identifier "$BUNDLE_ID" \
    --swift \
    --force

echo "🖼️  Inyectando icono maestro App Store (1024x1024)..."
if [ -f "AppIcon-1024.png" ]; then
    find "$PROJECT_NAME" -name "AppIcon.appiconset" -type d | while read -r iconset; do
        cp AppIcon-1024.png "$iconset/AppIcon-1024.png"
    done
fi

echo "✅ ¡Proyecto generado con éxito!"
echo ""
echo "Para abrirlo en Xcode y subir a App Store Connect:"
echo "  1. open \"$PROJECT_NAME/$PROJECT_NAME.xcodeproj\""
echo "  2. Selecciona tu Apple Developer Team en 'Signing & Capabilities'"
echo "  3. Menú Product > Archive > Distribute App > App Store Connect"
