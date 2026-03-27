#!/bin/bash

# Sign the Rust binary for macOS
# This script signs the dotagents-rs binary for distribution

BINARY_PATH="resources/bin/dotagents-rs"

if [ ! -f "$BINARY_PATH" ]; then
    echo "❌ Binary not found at $BINARY_PATH"
    exit 1
fi

# Check if we have a signing identity
if [ -n "$APPLE_DEVELOPER_ID" ]; then
    SIGNING_IDENTITY="$APPLE_DEVELOPER_ID"

    if [[ "$SIGNING_IDENTITY" != Developer\ ID\ Application:* ]]; then
        PREFERRED_IDENTITY="Developer ID Application: $SIGNING_IDENTITY"
        if security find-identity -v -p codesigning | grep -Fq "$PREFERRED_IDENTITY"; then
            SIGNING_IDENTITY="$PREFERRED_IDENTITY"
        fi
    fi

    echo "🔐 Signing binary with Developer ID: $SIGNING_IDENTITY"
    codesign --force --sign "$SIGNING_IDENTITY" --timestamp --options runtime "$BINARY_PATH"
    
    if [ $? -eq 0 ]; then
        echo "✅ Binary signed successfully"
    else
        echo "❌ Failed to sign binary"
        exit 1
    fi
else
    echo "⚠️  No APPLE_DEVELOPER_ID environment variable found"
    echo "⚠️  Skipping code signing (binary will work for development)"
    echo "⚠️  For distribution, set APPLE_DEVELOPER_ID to your Developer ID"
fi

echo "✅ Binary ready at $BINARY_PATH"
