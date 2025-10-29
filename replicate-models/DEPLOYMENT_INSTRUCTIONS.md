# Deploy DECA + PIFuHD Models to Replicate

## Prerequisites

1. Install Cog CLI:
```bash
sudo curl -o /usr/local/bin/cog -L https://github.com/replicate/cog/releases/latest/download/cog_`uname -s`_`uname -m`
sudo chmod +x /usr/local/bin/cog
```

2. Login to Replicate:
```bash
cog login
```

## Deploy DECA Face Model

```bash
cd replicate-models/deca-face
cog push r8.im/yourusername/deca-face
```

**Expected output:**
```
✓ Building Docker image...
✓ Pushing to Replicate...
✓ Deployed: r8.im/yourusername/deca-face:abc123def456
```

**Copy the model endpoint** (e.g., `yourusername/deca-face:abc123def456`)

## Deploy PIFuHD Body Model

```bash
cd replicate-models/pifuhd-body
cog push r8.im/yourusername/pifuhd-body
```

**Expected output:**
```
✓ Building Docker image...
✓ Pushing to Replicate...
✓ Deployed: r8.im/yourusername/pifuhd-body:xyz789ghi012
```

**Copy the model endpoint** (e.g., `yourusername/pifuhd-body:xyz789ghi012`)

## Test Models Locally (Optional)

Before pushing, you can test locally:

```bash
# Test DECA
cd replicate-models/deca-face
cog predict -i image=@test_face.jpg

# Test PIFuHD
cd replicate-models/pifuhd-body
cog predict -i image=@test_person.jpg
```

## Next Steps

Once both models are deployed, provide me with:
1. DECA model endpoint: `yourusername/deca-face:version-hash`
2. PIFuHD model endpoint: `yourusername/pifuhd-body:version-hash`

Then I will:
1. Update your Replicate API key secret
2. Modify the edge function to call both models
3. Update the frontend to load and merge the meshes

## Troubleshooting

**Build errors:**
- Make sure you have Docker installed and running
- DECA build takes ~15 minutes (downloads model weights)
- PIFuHD build takes ~10 minutes

**Model test failures:**
- Check that face is clearly visible in test image for DECA
- Check that full body is visible in test image for PIFuHD
- Ensure image is at least 512x512 pixels

**Push errors:**
- Verify you're logged in: `cog login`
- Check your Replicate account has available model slots
- Ensure model name doesn't conflict with existing models

## Expected Outputs

**DECA Model:**
- Returns: `{ mesh: Path, texture: Path }`
- Mesh format: OBJ (~5MB)
- Texture format: PNG (~2MB)
- Processing time: ~20 seconds

**PIFuHD Model:**
- Returns: `Path` (OBJ file)
- Mesh format: OBJ (~20MB)
- Processing time: ~40-60 seconds
- Resolution: 256x256x256 voxels (adjustable)

## Cost Estimates (Replicate)

- DECA: ~$0.10 per generation
- PIFuHD: ~$0.30 per generation
- Total per avatar: ~$0.40

GPU usage:
- DECA: ~20 seconds on NVIDIA T4
- PIFuHD: ~60 seconds on NVIDIA T4
