# Poe — editable 3D starter

Procedurally modeled against
[`poe_the_guide_to_perseverance.png`](../../source/poe_the_guide_to_perseverance.png).
This second pass has smaller inset eyes, a flatter crown, swept head feathers,
dense overlapping body plumage, a dark teal collar with gold edging, an oval
"P" pendant, shorter exposed ankles, and a longer tail. It remains a procedural
interpretation rather than an exact sculpt of the illustration. The existing
application still uses its PNG mascot.

## Review

- `poe-preview.png`: studio portrait.
- `poe-preview-v1.png`: preserved first-pass portrait for comparison.
- `poe-idle.mp4`: four-second idle preview rendered from the re-imported GLB.
- `poe-glb-preview.png`: still from that export, for material/texture comparison.
- `poe-blink.png` / `poe-head-tilt.png`: diagnostic animation poses.
- `poe-starter.blend`: editable mesh, eight-bone armature, materials, animation,
  camera, and lighting. Open in Blender and press Space over the timeline.
- `poe-starter.glb`: model and `Poe_Idle` animation, with no studio objects or
  external texture dependencies. Color and normal maps for fine feather barbs
  are embedded. Start at 0 seconds and loop over 4 seconds.
- `verification.json`: export and re-import checks, size, and triangle count.

In the Blender file, the idle uses frames 1–97 at 24 fps. Frames 1 and 97 match.
The GLB shifts the animation start to zero, and the video renders its frames 0–95
to avoid a duplicate endpoint. Chest scaling gives subtle breathing; the head turns and tilts.
The eye bones flatten the visible iris and pupil into a slit for a stylized blink.

## Regenerate

From `tech-refresh`, using Blender 4.5.3 LTS:

```sh
blender --background --factory-startup --python-exit-code 1 --python scripts/generate-poe.py
blender --background --factory-startup --python-exit-code 1 --python scripts/verify-poe.py -- --render-preview
```

These commands overwrite generated assets in this directory. Save hand-edited
versions under a different name before regenerating. No third-party Python
packages, textures, or production app dependencies are required.

## Next refinement

- Refine the sculpted likeness, natural feather variation, and eyelids after visual review.
- Weights are rigid per part. Head and idle motion work; unfolded wings and flight
  require better shoulder deformation and a fuller wing rig.
- Meshes are joined but not a single welded sculpt. Feather patches share generated
  UV textures; unique texture painting and retopology remain future work. This pass
  uses denser geometry for likeness review and needs optimization and device profiling
  before app integration.
- Verify the GLB in the chosen web/native renderer before integration. The current
  checks cover Blender re-import, skeletal deformation, blink timing, embedded
  resources, and matching loop endpoints, not browser or phone performance.
