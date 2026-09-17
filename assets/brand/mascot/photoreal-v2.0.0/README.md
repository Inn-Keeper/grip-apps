# Poe photoreal v2.0.0

Separate Cycles hero treatment based on
[`docs/poe-mascot-spec.md`](../../../../docs/poe-mascot-spec.md). The older
stylized model remains unchanged in [`../3d`](../3d/).

## Files

- `poe-photoreal.blend` — editable Cycles scene with four native curve-based
  feather systems, separate volumetric flight-feather meshes, collar, engraved
  locket, lighting, 85 mm camera, and four-second idle controls.
- `poe-hero.png` — neutral/wise hero render perched on old books.
- `build-report.json` — construction details and asset counts.
- `verification.json` — checks from reopening the delivered Blender file.
- `preserved-assets.sha256.json` — hashes proving the older mascot assets,
  generators, and source documents were not overwritten by this build.

The scene uses a neutral 0.028-linear body albedo. Teal-green iridescence is a
separate grazing-angle material driven by Layer Weight and limited to the nape
and wing-coverts systems. Gold is confined to collar trim and the locket. The
warm light is linked only to the locket.

## Rebuild and verify

From `tech-refresh`, with Blender 4.5.3 LTS:

```sh
blender --background --factory-startup --python-exit-code 1 --python scripts/generate-poe-photoreal.py
blender --background --factory-startup --python-exit-code 1 --python scripts/verify-poe-photoreal.py
```

The generator only writes inside this versioned directory. Do not regenerate
after hand editing without first saving the edited file under another name.

## Current limits

This is a procedural photoreal development model. The primary silhouette,
materials, lighting, feather construction, and neutral pose follow v2.0.0, but
production wildlife realism still needs artist-led anatomical sculpting,
asymmetric grooming, finer beak/foot detail, and color-managed final lighting.

No GLB is supplied. Cycles hair and angle-dependent shading do not transfer
faithfully to the app; a separate baked, optimized real-time treatment should
follow visual approval of this hero model.
