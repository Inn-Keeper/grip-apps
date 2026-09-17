"""Build Poe's editable 3D starter. Run with Blender --background --python this_file.

Only writes assets/brand/mascot/3d. No external textures or Python packages.
"""
from pathlib import Path
from math import sin, cos, pi, radians, exp
import json
import bpy
from mathutils import Vector

OUT = Path(__file__).resolve().parents[1] / "assets/brand/mascot/3d"
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.render.resolution_x = 900
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
scene.render.fps = 24
scene.frame_start, scene.frame_end = 1, 97
scene.world.color = (0.08, 0.08, 0.08)
scene.view_settings.view_transform = "AgX"


def material(name, rgb, metallic=0, roughness=0.4):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*rgb, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = (*rgb, 1)
    p.inputs["Metallic"].default_value = metallic
    p.inputs["Roughness"].default_value = roughness
    return m


ink = material("Poe · charcoal plumage", (0.009, 0.014, 0.021), 0.08, 0.46)
feather_mat = material("Poe · slate feather edges", (0.016, 0.024, 0.032), 0.12, 0.43)
teal_feather = material("Poe · iridescent flight feathers", (0.003, 0.020, 0.027), 0.16, 0.46)
beak_mat = material("Poe · polished black beak", (0.015, 0.022, 0.028), 0.25, 0.26)
black = material("Poe · eye and beak seam", (0.003, 0.006, 0.008), 0, 0.22)
iris = material("Poe · teal iris", (0.01, 0.29, 0.25), 0.18, 0.22)
gold = material("Poe · warm gold", (0.64, 0.36, 0.15), 0.75, 0.28)
cloth = material("Poe · dark teal collar", (0.003, 0.065, 0.063), 0, 0.78)
cloth_light = material("Poe · collar folds", (0.006, 0.084, 0.082), 0, 0.72)
glint = material("Poe · eye glint", (0.85, 0.98, 0.94), 0, 0.16)
parts = []

# Small shared, embedded textures supply the fine feather barbs that geometry
# alone cannot describe economically. Both color and tangent normals export.
texture_width,texture_height=128,256
color_pixels,normal_pixels=[],[]
for y in range(texture_height):
    v=y/(texture_height-1)
    for x in range(texture_width):
        u=x/(texture_width-1)
        cross=2*u-1
        phase=2*pi*(v*39-abs(cross)*5)
        shaft=exp(-cross*cross*1600)
        stripe=sin(phase)
        value=.90+.13*stripe+.20*shaft
        color_pixels.extend((.125*value,.15*value,.177*value,1))
        du=-.20*cos(phase)*(1 if cross>=0 else -1)
        dv=.28*cos(phase)
        n=Vector((du,dv,1)).normalized()
        normal_pixels.extend((n.x*.5+.5,n.y*.5+.5,n.z*.5+.5,1))
color_image=bpy.data.images.new("Poe feather barbs · color",texture_width,texture_height)
color_image.pixels.foreach_set(color_pixels)
color_image.pack()
normal_image=bpy.data.images.new("Poe feather barbs · normal",texture_width,texture_height)
normal_image.colorspace_settings.name="Non-Color"
normal_image.pixels.foreach_set(normal_pixels)
normal_image.pack()
plumage=material("Poe · fine black feather barbs",(.015,.022,.031),.12,.49)
p=plumage.node_tree.nodes.get("Principled BSDF")
tex=plumage.node_tree.nodes.new("ShaderNodeTexImage")
tex.image=color_image
plumage.node_tree.links.new(tex.outputs["Color"],p.inputs["Base Color"])
normal_tex=plumage.node_tree.nodes.new("ShaderNodeTexImage")
normal_tex.image=normal_image
normal_node=plumage.node_tree.nodes.new("ShaderNodeNormalMap")
normal_node.inputs["Strength"].default_value=.34
plumage.node_tree.links.new(normal_tex.outputs["Color"],normal_node.inputs["Color"])
plumage.node_tree.links.new(normal_node.outputs["Normal"],p.inputs["Normal"])


def finish(obj, name, mat, bone):
    obj.name = name
    obj.data.materials.append(mat)
    for p in obj.data.polygons:
        p.use_smooth = True
    if bone:
        group = obj.vertex_groups.new(name=bone)
        group.add(list(range(len(obj.data.vertices))), 1.0, "REPLACE")
        parts.append(obj)
    return obj


def ellipsoid(name, loc, scale, mat=ink, bone="chest", rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=12, location=loc)
    obj = bpy.context.object
    obj.scale = scale
    obj.rotation_euler = rotation
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, mat, bone)


def mesh(name, verts, faces, mat, bone):
    data = bpy.data.meshes.new(name)
    data.from_pydata(verts, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    return finish(obj, name, mat, bone)


def tube(name, coords, radius, mat, bone):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 6
    curve.bevel_depth = radius
    curve.bevel_resolution = 2
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(coords) - 1)
    for point, co in zip(spline.bezier_points, coords):
        point.co = co
        point.handle_left_type = point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve)
    scene.collection.objects.link(obj)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target="MESH")
    return finish(bpy.context.object, name, mat, bone)


def feather(name, start, end, width, mat, bone, normal=(0, -1, 0)):
    """Closed, tapered feather with a raised central ridge, not a flat card."""
    start, end, normal = Vector(start), Vector(end), Vector(normal).normalized()
    direction = end - start
    side = direction.normalized().cross(normal).normalized()
    verts = []
    sections = 9
    for i in range(sections):
        t = i / (sections - 1)
        w = width * (0.08 + 0.92 * sin(pi * t) ** 0.7) * (1 - 0.45 * t)
        center = start + direction * t + normal * (0.012 * sin(pi * t))
        verts.extend([center - side * w, center + normal * w * 0.10,
                      center + side * w, center - normal * w * 0.12])
    faces = []
    for i in range(sections - 1):
        for j in range(4):
            faces.append((i*4+j, i*4+(j+1)%4, (i+1)*4+(j+1)%4, (i+1)*4+j))
    faces.extend([(3, 2, 1, 0), tuple(range((sections-1)*4, sections*4))])
    obj=mesh(name, verts, faces, mat, bone)
    uv=obj.data.uv_layers.new(name="UVMap")
    for loop in obj.data.loops:
        index=loop.vertex_index
        uv.data[loop.index].uv=((0,.5,1,.5)[index%4],(index//4)/(sections-1))
    return obj


# Coordinates follow the reference: compact head, sloping back and long folded wings.
# Surface patches follow the plumage volume, so feathers overlap instead of floating.
def surface_feather(name, surface, theta, phi, length, width, mat, bone):
    verts = []
    rows, cols = 6, 5
    for layer in (1, -1):
        for i in range(rows):
            t = i / (rows - 1)
            spread = max(.009, sin(pi*(.16+.84*t))**.65) * (1-.22*t)
            for j in range(cols):
                across = 2*j/(cols-1)-1
                point, normal = surface(theta+length*t, phi+across*width*spread)
                # A slender shaft and shallow barbs catch light without bead-like bulges.
                ridge = .0035*(1-abs(across))**3*sin(pi*t)
                barb = .0008*sin(t*65-abs(across)*9)*sin(pi*t)
                lift = .001 + .025*t + ridge + barb
                verts.append(Vector(point)+Vector(normal)*(lift if layer==1 else lift-.003))
    faces=[]
    count=rows*cols
    for i in range(rows-1):
        for j in range(cols-1):
            a=i*cols+j
            faces.append((a,a+1,a+cols+1,a+cols))
            faces.append((a+count,a+cols+count,a+cols+1+count,a+1+count))
    border=list(range(cols))+[i*cols+cols-1 for i in range(1,rows)]
    border+=list(range(count-2,count-cols-1,-1))+[i*cols for i in range(rows-2,0,-1)]
    for a,b in zip(border,border[1:]+border[:1]):
        faces.append((a,a+count,b+count,b))
    obj=mesh(name,verts,faces,mat,bone)
    uv=obj.data.uv_layers.new(name="UVMap")
    for loop in obj.data.loops:
        index=loop.vertex_index%count
        uv.data[loop.index].uv=((index%cols)/(cols-1),(index//cols)/(rows-1))
    return obj


def body_surface(theta,phi):
    x=.425*sin(theta)*cos(phi)
    y=.435*sin(theta)*sin(phi)
    z=.735*cos(theta)
    tilt=.22
    p=(x,.13+y*cos(tilt)-z*sin(tilt),1.18+y*sin(tilt)+z*cos(tilt))
    n=Vector((x/.425**2,y/.435**2,z/.735**2)).normalized()
    return p,(n.x,n.y*cos(tilt)-n.z*sin(tilt),n.y*sin(tilt)+n.z*cos(tilt))


def head_surface(theta,phi):
    # Polar axis points toward the beak, so feathers sweep backward over the crown.
    p=Vector((.324*sin(theta)*sin(phi),-.14-.375*cos(theta),2.10+.248*sin(theta)*cos(phi)))
    n=Vector((p.x/.324**2,(p.y+.14)/.375**2,(p.z-2.10)/.248**2)).normalized()
    return p,n


ellipsoid("Sloping raven body",(0,.13,1.18),(.42,.43,.73),rotation=(.22,0,0))
ellipsoid("Neck",(0,-.075,1.76),(.285,.285,.40))
ellipsoid("Raven head",(0,-.14,2.10),(.32,.37,.245),bone="head")
ellipsoid("Shaggy throat base",(0,-.23,1.88),(.255,.27,.29),bone="head")

for row in range(16):
    for i in range(28):
        theta=.20+row*.17+.017*sin(i*7+row*11)
        phi=2*pi*(i+.5*(row%2))/28+.015*cos(i*11+row)
        surface_feather("Body plumage",body_surface,theta,phi,.29+.02*sin(i*3),.15,
                        plumage,"chest")

eyes=[Vector((s*.294,-.30,2.18)) for s in (-1,1)]
for row in range(15):
    theta=.30+row*.16
    for i in range(28):
        phi=2*pi*(i+.5*(row%2))/28+.01*sin(i*7+row)
        point,_=head_surface(theta+.10,phi)
        if min((point-eye).length for eye in eyes)<.091:
            continue
        surface_feather("Swept head plumage",head_surface,theta,phi,.40,.13,
                        plumage,"head")

# Shaggy throat feathers follow the neck's curve and tuck into the collar.
def throat_surface(theta,phi):
    p=Vector((.262*sin(theta)*cos(phi),-.23+.282*sin(theta)*sin(phi),1.90+.30*cos(theta)))
    n=Vector((p.x/.262**2,(p.y+.23)/.282**2,(p.z-1.9)/.30**2)).normalized()
    return p,n


for row in range(7):
    for i in range(15):
        phi=-pi+i*pi/14+.017*sin(i*5+row)
        surface_feather("Curved throat hackle",throat_surface,.42+row*.24,phi,
                        .46,.15,plumage,"head")

# Strong, almost horizontal raven bill with a small hooked tip.
def beak(name,sections,mat):
    verts,faces=[],[]
    for y,z,w,h in sections:
        for j in range(16):
            a=j*2*pi/16
            verts.append((w*cos(a),y,z+h*sin(a)))
    for i in range(len(sections)-1):
        for j in range(16):
            faces.append((i*16+j,i*16+(j+1)%16,(i+1)*16+(j+1)%16,(i+1)*16+j))
    faces.extend([tuple(reversed(range(16))),tuple(range(len(verts)-16,len(verts)))])
    return mesh(name,verts,faces,mat,"head")


beak("Upper raven bill",[(-.40,2.10,.133,.077),(-.52,2.11,.12,.073),
                        (-.68,2.09,.085,.055),(-.81,2.045,.035,.035),(-.835,2.013,.002,.003)],beak_mat)
beak("Lower raven bill",[(-.405,2.028,.125,.025),(-.60,2.020,.092,.025),
                        (-.75,2.015,.043,.015),(-.821,2.012,.003,.003)],ink)
for s in (-1,1):
    ellipsoid("Nostril",(s*.099,-.535,2.155),(.018,.027,.006),black,"head")
    normal=Vector((s*.92,-.39,0)).normalized()
    center=Vector((s*.294,-.30,2.18))
    rotation=Vector((0,-1,0)).rotation_difference(normal).to_euler()
    eye_bone="eye.L" if s<0 else "eye.R"
    ellipsoid("Inset eye",center,(.061,.018,.057),black,"head",rotation)
    ellipsoid("Teal iris",center+normal*.016,(.038,.007,.040),iris,eye_bone,rotation)
    ellipsoid("Pupil",center+normal*.022,(.027,.005,.030),black,eye_bone,rotation)
    ellipsoid("Catchlight",center+normal*.028+Vector((-.006,0,.013)),(.008,.004,.008),glint,eye_bone,rotation)
    # Three low overlapping brow feathers, not a separate cartoon eyebrow.
    for i in range(3):
        feather("Low brow feather",(s*(.253+i*.010),-.355+i*.025,2.233),
                (s*(.308+i*.006),-.23+i*.025,2.225),.024,ink,"head",(s*.8,-.3,.4))

# The wing's overlapping coverts flow into long flight feathers down the back.
for s in (-1,1):
    bone="wing.L" if s<0 else "wing.R"
    ellipsoid("Folded wing volume",(s*.355,.23,1.23),(.17,.37,.57),ink,bone,(.35,0,0))
    def wing_surface(theta,phi,s=s):
        x=s*(.355+.177*sin(theta)*cos(phi))
        y=.375*sin(theta)*sin(phi)
        z=.577*cos(theta)
        p=(x,.23+y*cos(.35)-z*sin(.35),1.23+y*sin(.35)+z*cos(.35))
        n=Vector((s*sin(theta)*cos(phi)/.177,sin(theta)*sin(phi)/.375,cos(theta)/.577)).normalized()
        return p,(n.x,n.y*cos(.35)-n.z*sin(.35),n.y*sin(.35)+n.z*cos(.35))
    for row in range(10):
        for i in range(14):
            theta=.23+row*.19+.016*sin(i*7+row)
            phi=-pi/2+(i+.5*(row%2))*.235
            surface_feather("Layered wing covert",wing_surface,theta,phi,.35,.16,
                            plumage,bone)
    for i in range(9):
        feather("Long flight feather",(s*(.50-.022*i),.21+i*.055,1.19+i*.018),
                (s*(.35-.022*i),.98+i*.025,.23+i*.037),.069,
                teal_feather if i%4==0 else plumage,bone,(s*.94,-.15,.25))
        # A narrow feather shaft adds detail at close range.
        feather("Flight feather shaft",(s*(.505-.022*i),.24+i*.055,1.13+i*.018),
                (s*(.355-.022*i),.97+i*.025,.28+i*.037),.003,
                feather_mat,bone,(s*.94,-.15,.25))

for i in range(9):
    x=(i-4)*.055
    feather("Long tapered tail",(x*.60,.37,.85),(x,1.18+.10*(1-abs(i-4)/4),.13+abs(i-4)*.023),
            .065,plumage if i%3 else teal_feather,"tail",(0,-.18,1))

# One draped collar ribbon, dipping into a V at the chest, with gold edge piping.
def collar_point(a,t):
    front=max(0,-sin(a))
    r=.318+.012*sin(pi*t)+.003*sin(a*13+t*7)
    return (r*cos(a),-.055+(.373+.009*sin(pi*t))*sin(a),
            1.78-.16*front+.12*t+.014*sin(a*3)*sin(pi*t))


verts,faces=[],[]
for i in range(65):
    for j in range(7):
        verts.append(collar_point(2*pi*i/64,j/6))
for i in range(64):
    for j in range(6):
        a=i*7+j
        faces.append((a,a+7,a+8,a+1))
collar=mesh("Draped teal collar",verts,faces,cloth,"chest")
solid=collar.modifiers.new("Cloth thickness","SOLIDIFY")
solid.thickness=.008
bpy.context.view_layer.objects.active=collar
collar.select_set(True)
bpy.ops.object.modifier_apply(modifier=solid.name)
for t in (0,1):
    tube("Collar gold edging",[collar_point(2*pi*i/64,t) for i in range(65)],.006,gold,"chest")
for t in (.30,.68):
    tube("Collar seam",[collar_point(2*pi*i/64,t) for i in range(65)],.0025,cloth_light,"chest")
tube("Pendant link",[(-.008,-.432,1.63),(-.027,-.465,1.565),(0,-.48,1.55),(.025,-.452,1.60)],.009,gold,"chest")
ellipsoid("Oval gold medallion",(0,-.475,1.47),(.072,.020,.10),gold,"chest")
ellipsoid("Dark medallion face",(0,-.494,1.47),(.057,.008,.081),ink,"chest")
letter_data=bpy.data.curves.new("Poe initial","FONT")
letter_data.body="P"
letter_data.size=.119
letter_data.align_x="CENTER"
letter_data.align_y="CENTER"
letter_data.extrude=.0015
letter=bpy.data.objects.new("P pendant initial",letter_data)
scene.collection.objects.link(letter)
letter.location=(0,-.506,1.47)
letter.rotation_euler=(pi/2,0,0)
bpy.ops.object.select_all(action="DESELECT")
letter.select_set(True)
bpy.context.view_layer.objects.active=letter
bpy.ops.object.convert(target="MESH")
finish(bpy.context.object,"P pendant initial",gold,"chest")

# Short exposed ankles and grounded claws, rather than long toy-like legs.
for s in (-1,1):
    x=s*.18
    offset=.045 if s<0 else 0
    tube("Ankle",[(x,.13+offset,.68),(x,.025+offset,.30),(x,-.055+offset,.13)],.031,beak_mat,"root")
    for i in range(6):
        z=.17+i*.028
        y=-.046+i*.014+offset
        tube("Ankle scale",[(x-.025,y,z),(x,y-.012,z-.003),(x+.025,y,z)],.0045,feather_mat,"root")
    for i in range(3):
        end=(x+(i-1)*.105,-.30+abs(i-1)*.045+offset,.07)
        tube("Raven toe",[(x,-.05+offset,.135),(x+(i-1)*.055,-.17+offset,.085),end],.022,beak_mat,"root")
        tube("Curved claw",[end,(end[0],end[1]-.046,.060),(end[0],end[1]-.06,.030)],.011,black,"root")
    tube("Rear toe",[(x,.02+offset,.13),(x,.15+offset,.075),(x+s*.04,.205+offset,.05)],.021,beak_mat,"root")


# An actual armature, with rigid weights suited to this segmented starter model.
bpy.ops.object.select_all(action="DESELECT")
arm_data=bpy.data.armatures.new("Poe skeleton")
rig=bpy.data.objects.new("Poe_Rig",arm_data)
scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig
rig.select_set(True)
bpy.ops.object.mode_set(mode="EDIT")
bone_defs={
    "root":((0,0,0),(0,0,.4),None),
    "chest":((0,0,1.05),(0,0,1.9),"root"),
    "head":((0,0,1.98),(0,0,2.55),"chest"),
    "wing.L":((-.34,.04,1.8),(-.40,.12,1.15),"chest"),
    "wing.R":((.34,.04,1.8),(.40,.12,1.15),"chest"),
    "tail":((0,.27,1.02),(0,.79,.47),"chest"),
    "eye.L":((-.294,-.30,2.18),(-.294,-.30,2.28),"head"),
    "eye.R":((.294,-.30,2.18),(.294,-.30,2.28),"head"),
}
for name,(head,tail,parent) in bone_defs.items():
    b=arm_data.edit_bones.new(name)
    b.head,b.tail=head,tail
    if parent:
        b.parent=arm_data.edit_bones[parent]
bpy.ops.object.mode_set(mode="OBJECT")
rig.show_in_front=True
for obj in parts:
    obj.parent=rig
    mod=obj.modifiers.new("Poe skeletal deformation","ARMATURE")
    mod.object=rig

# Merge surfaces into one skinned mesh for a compact, inspectable export.
bpy.ops.object.select_all(action="DESELECT")
for obj in parts:
    obj.select_set(True)
bpy.context.view_layer.objects.active=parts[0]
bpy.ops.object.join()
character=bpy.context.object
character.name="Poe · skinned character"

for name in bone_defs:
    rig.pose.bones[name].rotation_mode="XYZ"
for frame,amount in [(1,0),(25,1),(49,0),(73,1),(97,0)]:
    chest=rig.pose.bones["chest"]
    chest.scale=(1+.014*amount,1+.009*amount,1+.018*amount)
    chest.keyframe_insert("scale",frame=frame,group="Breathing")
for frame,tilt,turn in [(1,0,0),(25,-2,-3),(49,0,0),(65,3,4),(81,1,2),(97,0,0)]:
    head=rig.pose.bones["head"]
    head.rotation_euler=(radians(tilt*.4),radians(turn),radians(tilt))
    head.keyframe_insert("rotation_euler",frame=frame,group="Head curiosity")
for name in ("eye.L","eye.R"):
    for frame,openness in [(1,1),(32,1),(34,.035),(36,1),(74,1),(76,.035),(78,1),(97,1)]:
        # Bone local Y points upward: compress visible eye into a closed slit.
        eye=rig.pose.bones[name]
        eye.scale=(1,openness,1)
        eye.keyframe_insert("scale",frame=frame,group="Blink")
action=rig.animation_data.action
action.name="Poe_Idle"
rig["animation_notes"]="4 second idle; frames 1 and 97 match. Eye bones compress the iris/pupil for a stylized blink."
rig["starter_limitations"]="Rigid feather weights; refine shoulder deformation before unfolded wing animation."
scene.frame_set(1)

# Model-only GLB: studio objects never enter the export.
bpy.ops.object.select_all(action="DESELECT")
rig.select_set(True)
character.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(OUT/"poe-starter.glb"),export_format="GLB",
                          use_selection=True,export_animations=True,export_animation_mode="ACTIONS",
                          export_force_sampling=True,export_skins=True,export_anim_slide_to_zero=True)

# Studio setup is retained in .blend for easy review and editing.
floor_mat=material("Studio · midnight",(.035,.049,.064),0,.72)
bpy.ops.mesh.primitive_plane_add(size=200)
floor=bpy.context.object
floor.name="Studio floor · excluded from GLB"
floor.data.materials.append(floor_mat)

def aim(obj, target):
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat("-Z","Y").to_euler()


for name,loc,power,size,color in [
    ("Key",(3,-4,6),450,4,(.78,.88,1)),
    ("Fill",(-3,-2,3),220,3,(.48,.79,.79)),
    ("Warm rim",(2,3,5),500,3,(1,.82,.61)),
]:
    data=bpy.data.lights.new(name,"AREA")
    data.energy,data.shape,data.size,data.color=power,"DISK",size,color
    light=bpy.data.objects.new(name,data)
    scene.collection.objects.link(light)
    light.location=loc
    aim(light,(0,0,1.3))
bpy.ops.object.camera_add(location=(6,-7,2.95))
camera=bpy.context.object
camera.name="Poe portrait camera"
camera.data.type="ORTHO"
camera.data.ortho_scale=2.95
aim(camera,(0,.17,1.21))
scene.camera=camera
scene.render.image_settings.file_format="PNG"
scene.render.filepath=str(OUT/"poe-preview.png")
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"poe-starter.blend"))
bpy.ops.render.render(write_still=True)

# Separate diagnostic frames make blink/pose review possible without a player.
scene.frame_set(34)
scene.render.filepath=str(OUT/"poe-blink.png")
bpy.ops.render.render(write_still=True)
scene.frame_set(65)
scene.render.filepath=str(OUT/"poe-head-tilt.png")
bpy.ops.render.render(write_still=True)
scene.frame_set(1)

assert len(arm_data.bones)==8
assert character.type=="MESH" and character.vertex_groups.get("head")
assert (OUT/"poe-starter.glb").stat().st_size>10000
print("POE_GENERATED",json.dumps({"vertices":len(character.data.vertices),
      "triangles":sum(len(p.vertices)-2 for p in character.data.polygons),
      "bones":len(arm_data.bones),"animation":action.name,"output":str(OUT)}))
