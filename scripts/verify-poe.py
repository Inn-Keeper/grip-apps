"""Blender --background --python scripts/verify-poe.py [-- --render-preview]."""
from pathlib import Path
import json
import struct
import sys
import bpy

OUT = Path(__file__).resolve().parents[1] / "assets/brand/mascot/3d"
raw = (OUT / "poe-starter.glb").read_bytes()
magic, version, length = struct.unpack_from("<4sII", raw)
assert (magic, version, length) == (b"glTF", 2, len(raw))
json_length, chunk_type = struct.unpack_from("<II", raw, 12)
assert chunk_type == 0x4E4F534A
gltf = json.loads(raw[20:20+json_length])
assert len(gltf["skins"]) == 1 and len(gltf["skins"][0]["joints"]) == 8
assert len(gltf["animations"]) == 1
assert gltf["animations"][0]["name"] == "Poe_Idle"
assert not gltf.get("cameras")
assert len(gltf.get("images", [])) == 2
assert all("bufferView" in image and "uri" not in image for image in gltf["images"])
assert any("normalTexture" in material for material in gltf["materials"])
assert all("uri" not in b for b in gltf["buffers"])
assert all("JOINTS_0" in p["attributes"] and "WEIGHTS_0" in p["attributes"]
           for m in gltf["meshes"] for p in m["primitives"])
duration = max(gltf["accessors"][s["input"]]["max"][0]
               for s in gltf["animations"][0]["samplers"])
assert abs(duration - 4) < 0.001

# Re-import the delivered GLB, not just the original working scene.
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(OUT / "poe-starter.glb"))
scene = bpy.context.scene
scene.render.fps = 24
rig = next(o for o in scene.objects if o.type == "ARMATURE")
assert rig.animation_data and rig.animation_data.action
mesh = next(o for o in scene.objects if o.type == "MESH")


def positions(frame):
    scene.frame_set(frame)
    evaluated = mesh.evaluated_get(bpy.context.evaluated_depsgraph_get())
    return [v.co.copy() for v in evaluated.data.vertices]


start = positions(0)
blink = positions(33)
tilt = positions(64)
end = positions(96)
loop_error = max((a-b).length for a,b in zip(start,end))
motion = max((a-b).length for a,b in zip(start,tilt))
blink_motion = max((a-b).length for a,b in zip(start,blink))
assert loop_error < 0.00001, loop_error
assert motion > 0.005 and blink_motion > 0.005
scene.frame_set(33)
assert rig.pose.bones["eye.L"].scale.y < 0.1
scene.frame_set(35)
assert rig.pose.bones["eye.L"].scale.y > 0.95
report = {
    "blender_version": bpy.app.version_string,
    "glb_bytes": len(raw),
    "triangles": sum(gltf["accessors"][p["indices"]]["count"]//3
                     for m in gltf["meshes"] for p in m["primitives"]),
    "materials": len(gltf["materials"]),
    "embedded_textures": len(gltf["images"]),
    "bones": 8,
    "animation": "Poe_Idle",
    "duration_seconds": duration,
    "loop_vertex_error": loop_error,
    "head_tilt_max_vertex_displacement": motion,
    "blink_max_vertex_displacement": blink_motion,
    "glb_reimport": "passed",
    "embedded_resources": True,
}
(OUT / "verification.json").write_text(json.dumps(report, indent=2) + "\n")
print("POE_VERIFIED", json.dumps(report))

if "--render-preview" in sys.argv:
    bpy.ops.wm.open_mainfile(filepath=str(OUT / "poe-starter.blend"))
    scene = bpy.context.scene
    # Keep the studio but replace the working mesh with the actual GLB delivery.
    working_rig = bpy.data.objects["Poe_Rig"]
    for obj in list(working_rig.children) + [working_rig]:
        bpy.data.objects.remove(obj, do_unlink=True)
    bpy.ops.import_scene.gltf(filepath=str(OUT / "poe-starter.glb"))
    scene.render.resolution_x = 450
    scene.render.resolution_y = 500
    scene.cycles.samples = 8
    scene.frame_start, scene.frame_end = 0, 95
    scene.frame_set(0)
    scene.render.filepath = str(OUT / "poe-glb-preview.png")
    bpy.ops.render.render(write_still=True)
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format = "MPEG4"
    scene.render.ffmpeg.codec = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.filepath = str(OUT / "poe-idle.mp4")
    bpy.ops.render.render(animation=True)
