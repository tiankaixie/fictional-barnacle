#!/bin/bash

# Create test model files for development
# These are placeholder files - replace with real ONNX models for production

set -e

echo "🎙️  Creating test model files..."
echo ""

# Create models directory
mkdir -p assets/models

# Create placeholder model.onnx (10MB test file)
echo "Creating model.onnx (10 MB placeholder)..."
dd if=/dev/zero of=assets/models/model.onnx bs=1048576 count=10 2>/dev/null
echo "  ✓ Created assets/models/model.onnx"

# Create tokens.txt
echo "Creating tokens.txt..."
cat > assets/models/tokens.txt << 'EOF'
<pad>
<unk>
<s>
</s>
a
b
c
d
e
f
g
h
i
j
k
l
m
n
o
p
q
r
s
t
u
v
w
x
y
z
0
1
2
3
4
5
6
7
8
9
EOF
echo "  ✓ Created assets/models/tokens.txt"

# Create config.json
echo "Creating config.json..."
cat > assets/models/config.json << 'EOF'
{
  "model_type": "sense-voice-small",
  "vocab_size": 50000,
  "hidden_size": 768,
  "num_attention_heads": 12,
  "num_hidden_layers": 12,
  "intermediate_size": 3072,
  "max_position_embeddings": 512,
  "sample_rate": 16000,
  "n_mels": 80,
  "version": "test-placeholder"
}
EOF
echo "  ✓ Created assets/models/config.json"

echo ""
echo "✅ Test model files created successfully!"
echo ""
echo "📊 File sizes:"
ls -lh assets/models/

echo ""
echo "⚠️  WARNING: These are placeholder files for testing the plugin."
echo "   Replace with real SenseVoice ONNX models for production use."
echo ""
echo "Next steps:"
echo "  1. Run: npm install"
echo "  2. Run: npx expo prebuild"
echo "  3. Verify models are copied to ios/ and android/"
