"""
Generate pristine multi-resolution icons for ClickBox Importador:
- App Store Connect icon (1024x1024, RGB, no alpha)
- Safari Web Extension & Chrome icons (512, 256, 128, 64, 48, 32, 16)
"""

import math
from PIL import Image, ImageDraw

def create_master_icon(size=2048):
    # Render at 2048x2048 for supersampling
    img = Image.new("RGBA", (size, size), (15, 23, 42, 255)) # #0f172a dark slate
    draw = ImageDraw.Draw(img)

    # Background subtle radial glow
    center_x, center_y = size // 2, size // 2
    max_radius = int(size * 0.65)
    for r in range(max_radius, 0, -8):
        factor = 1.0 - (r / max_radius)
        # Glow from #1e293b to #2563eb
        alpha = int(factor * factor * 70)
        draw.ellipse(
            [center_x - r, center_y - r, center_x + r, center_y + r],
            fill=(37, 99, 235, alpha)
        )

    # Isometric 3D Box in the center
    # Box parameters
    w = size * 0.38
    h = size * 0.22
    box_h = size * 0.32
    cy = size * 0.52

    # Coordinates
    # Top face
    p_top = (center_x, cy - box_h - h)
    p_right = (center_x + w, cy - box_h)
    p_center = (center_x, cy - box_h + h)
    p_left = (center_x - w, cy - box_h)

    # Bottom coordinates
    p_bottom = (center_x, cy + h)
    p_bottom_right = (center_x + w, cy)
    p_bottom_left = (center_x - w, cy)

    # Draw Left Face (Medium Blue)
    draw.polygon([p_left, p_center, p_bottom, p_bottom_left], fill=(30, 64, 175, 255)) # #1e40af

    # Draw Right Face (Darker Blue)
    draw.polygon([p_center, p_right, p_bottom_right, p_bottom], fill=(29, 78, 216, 255)) # #1d4ed8

    # Draw Top Face (Vibrant Sky/Royal Blue)
    draw.polygon([p_top, p_right, p_center, p_left], fill=(59, 130, 246, 255)) # #3b82f6

    # Tape on top face (crisp white / light accent)
    tape_w = w * 0.22
    tape_h = h * 0.22
    tape_pts = [
        (center_x, cy - box_h - h),
        (center_x + (w * 0.15), cy - box_h - (h * 0.85)),
        (center_x, cy - box_h + h),
        (center_x - (w * 0.15), cy - box_h + (h * 0.85)),
    ]
    draw.polygon(tape_pts, fill=(241, 245, 249, 230))

    # Tape continuing down front-left face
    tape_left_pts = [
        (center_x - (w * 0.15), cy - box_h + (h * 0.85)),
        (center_x, cy - box_h + h),
        (center_x, cy - (box_h * 0.2) + h),
        (center_x - (w * 0.15), cy - (box_h * 0.2) + (h * 0.85)),
    ]
    draw.polygon(tape_left_pts, fill=(226, 232, 240, 220))

    # Highlight lines / edge bevels
    draw.line([p_top, p_left, p_center, p_right, p_top], fill=(147, 197, 253, 200), width=6)
    draw.line([p_center, p_bottom], fill=(147, 197, 253, 160), width=6)
    draw.line([p_left, p_bottom_left, p_bottom, p_bottom_right, p_right], fill=(30, 58, 138, 180), width=6)

    # Subtle floating downward arrow indicating "importing into the box"
    arrow_cy = cy - box_h - (h * 1.5)
    arrow_color = (255, 255, 255, 240)
    aw = size * 0.08
    ah = size * 0.09
    draw.polygon([
        (center_x, arrow_cy + ah),
        (center_x + aw, arrow_cy),
        (center_x + (aw * 0.4), arrow_cy),
        (center_x + (aw * 0.4), arrow_cy - ah),
        (center_x - (aw * 0.4), arrow_cy - ah),
        (center_x - (aw * 0.4), arrow_cy),
        (center_x - aw, arrow_cy),
    ], fill=arrow_color)

    return img

def main():
    master = create_master_icon(2048)

    # 1. App Store 1024x1024 (MUST be RGB, NO alpha)
    app_icon_1024 = master.resize((1024, 1024), Image.Resampling.LANCZOS).convert("RGB")
    app_icon_1024.save("AppIcon-1024.png", format="PNG", optimize=True)
    print("Saved AppIcon-1024.png (1024x1024, RGB)")

    # 2. Web & Extension icons (RGBA)
    sizes = [512, 256, 128, 64, 48, 32, 16]
    for s in sizes:
        resized = master.resize((s, s), Image.Resampling.LANCZOS)
        filename = f"icon{s}.png"
        resized.save(filename, format="PNG", optimize=True)
        print(f"Saved {filename} ({s}x{s}, RGBA)")

if __name__ == "__main__":
    main()
