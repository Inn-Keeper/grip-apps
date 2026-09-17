"""Verify the saved v2 Cycles build and confirm preserved v1 files are unchanged."""
from pathlib import Path
import hashlib
import json
import bpy

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"assets/brand/mascot/photoreal-v2.0.0"
blend=OUT/"poe-photoreal.blend"
bpy.ops.wm.open_mainfile(filepath=str(blend))
scene=bpy.context.scene
assert scene.render.engine=="CYCLES"
assert scene.cycles_curves.shape=="THICK"
assert scene.camera.data.lens==85
assert scene.camera.data.dof.use_dof and scene.camera.data.dof.aperture_fstop==4
assert scene.get("mascot_spec")=="docs/poe-mascot-spec.md v2.0.0"

expected={"01 Contour body coat","02 Head, nape and throat hackles",
          "03 Wing coverts","04 Flight feather barbs"}
curves={o.name:o for o in scene.objects if o.type=="CURVES"}
assert set(curves)==expected
assert all(o.get("construction")=="Individual curved rachises and barbs; no feather cards"
           for o in curves.values())
irid=bpy.data.materials["Nape and coverts · grazing teal-green only"]
assert any(n.type=="LAYER_WEIGHT" for n in irid.node_tree.nodes)
base=bpy.data.materials["Feathers · neutral 0.028 linear albedo"]
assert tuple(round(v,3) for v in base.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value[:3])==(.028,.028,.028)
gold=bpy.data.materials["Poe Gold · metal only"]
assert gold.node_tree.nodes["Principled BSDF"].inputs["Metallic"].default_value==1
warm=scene.objects["Warm locket-only light"]
assert [o.name for o in warm.light_linking.receiver_collection.objects]==["Small oval gold locket"]
locket=scene.objects["Small oval gold locket"]
assert locket.data.name and not any(o.name=="P engraving cutter" for o in scene.objects)
assert any(o.data is bpy.data.meshes["Shared volumetric flight feather"]
           for o in scene.objects if o.type=="MESH")

def transforms(frame):
    scene.frame_set(frame)
    return tuple(scene.objects[name].matrix_world.copy() for name in ("Poe · breathing","Poe · head pose"))

start,end,mid=transforms(1),transforms(97),transforms(65)
def matrix_delta(a,b):
    return max(abs(a[row][column]-b[row][column]) for row in range(4) for column in range(4))


assert all(matrix_delta(a,b)<1e-8 for a,b in zip(start,end))
assert any(matrix_delta(a,b)>1e-5 for a,b in zip(start,mid))

baseline=json.loads((OUT/"preserved-assets.sha256.json").read_text())
changed=[]
for relative,digest in baseline.items():
    p=ROOT/relative
    if not p.exists() or hashlib.sha256(p.read_bytes()).hexdigest()!=digest:
        changed.append(relative)
assert not changed,f"Preserved files changed: {changed}"

report={
    "blend_reopen":"passed","renderer":"Cycles","hair_shape":"THICK",
    "hair_systems":len(curves),"curve_count":sum(len(o.data.curves) for o in curves.values()),
    "curve_points":sum(len(o.data.points) for o in curves.values()),
    "animation_loop":"passed","animation_motion":"passed",
    "iridescence_layer_weight":"passed","locket_only_light_link":"passed",
    "old_version_files_verified":len(baseline),"old_version_changed":changed,
}
(OUT/"verification.json").write_text(json.dumps(report,indent=2)+"\n")
print("POE_PHOTOREAL_VERIFIED",json.dumps(report))
