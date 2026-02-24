#!/bin/bash

mkdir -p resources/bin

cd dotagents-rs

cargo build -r

# Handle different platforms
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
    # Windows
    cp target/release/dotagents-rs.exe ../resources/bin/dotagents-rs.exe
else
    # Unix-like systems (macOS, Linux)
    cp target/release/dotagents-rs ../resources/bin/dotagents-rs
fi

cd ..

# Sign the binary on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🔐 Signing Rust binary..."
    ./scripts/sign-binary.sh
fi
