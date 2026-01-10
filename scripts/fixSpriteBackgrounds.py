#!/usr/bin/env python3
"""
Fix sprite backgrounds by removing black/dark areas and making them transparent.
More conservative approach - only removes pure black and very dark backgrounds.
"""

import os
from PIL import Image
import numpy as np
from scipy import ndimage

# Sprites that need background fixing
SPRITES_TO_FIX = [
    # DeFi
    "public/Building/crypto/defi/2x2compound_bank_south.png",
    "public/Building/crypto/defi/2x3eigenlayer_restaking_south.png",
    # Exchange
    "public/Building/crypto/exchange/3x3coinbase_hq_south.png",
    "public/Building/crypto/exchange/2x3kraken_exchange_south.png",
    "public/Building/crypto/exchange/2x2bybit_arena_south.png",
    # CT
    "public/Building/crypto/ct/2x2dao_hq_south.png",
    "public/Building/crypto/ct/2x2degen_lounge_south.png",
    "public/Building/crypto/ct/2x2nft_gallery_south.png",
    "public/Building/crypto/ct/2x2vc_office_south.png",
    # Meme
    "public/Building/crypto/meme/2x2wif_temple_south.png",
    "public/Building/crypto/meme/2x3moon_monument_south.png",
    # Plasma
    "public/Building/crypto/plasma/3x3plasma_reactor_south.png",
    "public/Building/crypto/plasma/2x3plasma_bridge_south.png",
    # Infrastructure
    "public/Building/crypto/infrastructure/3x3chainlink_hub_south.png",
    "public/Building/crypto/infrastructure/2x2pyth_observatory_south.png",
    "public/Building/crypto/infrastructure/2x3layerzero_bridge_south.png",
]

def is_dark_background(r, g, b):
    """Check if a color is a dark background (black/very dark only)"""
    r, g, b = int(r), int(g), int(b)
    # Pure black or very dark (RGB all < 25)
    if r < 25 and g < 25 and b < 25:
        return True
    # Very dark gray (all channels similar and low)
    if max(r, g, b) < 40 and abs(r - g) < 10 and abs(g - b) < 10:
        return True
    return False

def is_checkered_bg(r, g, b):
    """Check if color is part of a checkered transparency pattern"""
    r, g, b = int(r), int(g), int(b)
    # Light checkered
    if abs(r - 204) < 8 and abs(g - 204) < 8 and abs(b - 204) < 8:
        return True
    if abs(r - 238) < 8 and abs(g - 238) < 8 and abs(b - 238) < 8:
        return True
    # Dark checkered
    if abs(r - 153) < 8 and abs(g - 153) < 8 and abs(b - 153) < 8:
        return True
    if abs(r - 170) < 8 and abs(g - 170) < 8 and abs(b - 170) < 8:
        return True
    return False

def fix_sprite_background(filepath):
    """Fix the background of a sprite image using connected components"""
    print(f"Processing: {os.path.basename(filepath)}")
    
    try:
        img = Image.open(filepath).convert('RGBA')
    except Exception as e:
        print(f"  Error loading: {e}")
        return False
    
    img_array = np.array(img)
    height, width = img_array.shape[:2]
    original_alpha = img_array[:, :, 3].copy()
    
    # Create mask of dark pixels
    dark_mask = np.zeros((height, width), dtype=bool)
    checkered_mask = np.zeros((height, width), dtype=bool)
    
    for y in range(height):
        for x in range(width):
            r, g, b = img_array[y, x, :3]
            if is_dark_background(r, g, b):
                dark_mask[y, x] = True
            if is_checkered_bg(r, g, b):
                checkered_mask[y, x] = True
    
    # Label connected components of dark regions
    dark_labeled, num_dark = ndimage.label(dark_mask)
    
    # Find components that touch the edges (these are backgrounds)
    edge_labels = set()
    
    # Top and bottom edges
    for x in range(width):
        if dark_labeled[0, x] > 0:
            edge_labels.add(dark_labeled[0, x])
        if dark_labeled[height-1, x] > 0:
            edge_labels.add(dark_labeled[height-1, x])
    
    # Left and right edges
    for y in range(height):
        if dark_labeled[y, 0] > 0:
            edge_labels.add(dark_labeled[y, 0])
        if dark_labeled[y, width-1] > 0:
            edge_labels.add(dark_labeled[y, width-1])
    
    # Create mask of background (dark regions touching edges)
    bg_mask = np.zeros((height, width), dtype=bool)
    for label in edge_labels:
        bg_mask |= (dark_labeled == label)
    
    # Also label checkered regions
    checkered_labeled, num_checkered = ndimage.label(checkered_mask)
    
    # Find checkered components touching edges
    checkered_edge_labels = set()
    for x in range(width):
        if checkered_labeled[0, x] > 0:
            checkered_edge_labels.add(checkered_labeled[0, x])
        if checkered_labeled[height-1, x] > 0:
            checkered_edge_labels.add(checkered_labeled[height-1, x])
    for y in range(height):
        if checkered_labeled[y, 0] > 0:
            checkered_edge_labels.add(checkered_labeled[y, 0])
        if checkered_labeled[y, width-1] > 0:
            checkered_edge_labels.add(checkered_labeled[y, width-1])
    
    for label in checkered_edge_labels:
        bg_mask |= (checkered_labeled == label)
    
    # Apply the mask - make background transparent
    new_alpha = original_alpha.copy()
    new_alpha[bg_mask] = 0
    
    # Also remove dark pixels in top rows (gradient backgrounds)
    for y in range(min(100, height // 4)):
        for x in range(width):
            r, g, b = img_array[y, x, :3]
            if is_dark_background(r, g, b):
                new_alpha[y, x] = 0
    
    # Update alpha channel
    img_array[:, :, 3] = new_alpha
    
    # Save the fixed image
    result = Image.fromarray(img_array)
    result.save(filepath, optimize=True)
    
    # Stats
    original_opaque = np.sum(original_alpha > 0)
    new_opaque = np.sum(new_alpha > 0)
    removed = original_opaque - new_opaque
    
    pct = 100 * removed / max(1, original_opaque)
    print(f"  Removed {removed:,} pixels ({pct:.1f}%)")
    
    if pct > 90:
        print(f"  WARNING: Removed too much! Check this file.")
    
    return True

def main():
    # Get the project root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    print("=" * 60)
    print("CRYPTO SPRITE BACKGROUND FIXER v2")
    print("=" * 60)
    print(f"Project root: {project_root}")
    print(f"Sprites to fix: {len(SPRITES_TO_FIX)}")
    print("=" * 60)
    
    success_count = 0
    fail_count = 0
    
    for sprite_path in SPRITES_TO_FIX:
        full_path = os.path.join(project_root, sprite_path)
        if os.path.exists(full_path):
            if fix_sprite_background(full_path):
                success_count += 1
            else:
                fail_count += 1
        else:
            print(f"File not found: {sprite_path}")
            fail_count += 1
    
    print("=" * 60)
    print(f"COMPLETE: {success_count} fixed, {fail_count} failed")
    print("=" * 60)

if __name__ == "__main__":
    main()
