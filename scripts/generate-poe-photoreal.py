"""Separate Cycles hero build for docs/poe-mascot-spec.md v2.0.0.

blender -b --factory-startup --python-exit-code 1 --python scripts/generate-poe-photoreal.py
Does not read, execute, or overwrite the older mascot generator or its assets.
"""
from pathlib import Path
from math import sin, cos, pi, exp
import json
import random
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/brand/mascot/photoreal-v2.0.0"
OUT.mkdir(exist_ok=True)
rng = random.Random(20910)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 48
scene.cycles.use_denoising = True
scene.cycles_curves.shape = "THICK"
scene.cycles_curves.subdivisions = 2
scene.render.resolution_x, scene.render.resolution_y = 1000, 1200
scene.render.resolution_percentage = 100
scene.render.fps = 24
scene.frame_start, scene.frame_end = 1, 97
scene.view_settings.view_transform = "AgX"
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs[0].default_value = (.12,.12,.12,1)
scene.world.node_tree.nodes["Background"].inputs[1].default_value = .15


def mat(name, color, rough=.6, metal=0):
    m=bpy.data.materials.new(name)
    m.diffuse_color=(*color,1)
    m.use_nodes=True
    p=m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value=(*color,1)
    p.inputs["Roughness"].default_value=rough
    p.inputs["Metallic"].default_value=metal
    return m


coat=mat("Feathers · neutral 0.028 linear albedo",(.028,.028,.028),.62)
irid=coat.copy()
irid.name="Nape and coverts · grazing teal-green only"
nodes,links=irid.node_tree.nodes,irid.node_tree.links
base=nodes.get("Principled BSDF")
layer=nodes.new("ShaderNodeLayerWeight")
layer.inputs["Blend"].default_value=.32
ramp=nodes.new("ShaderNodeValToRGB")
ramp.color_ramp.elements[0].position=.20
ramp.color_ramp.elements[0].color=(.004,.026,.020,1)
ramp.color_ramp.elements[1].position=.95
ramp.color_ramp.elements[1].color=(.027,.12,.056,1)
links.new(layer.outputs["Fresnel"],ramp.inputs[0])
edge=nodes.new("ShaderNodeBsdfPrincipled")
edge.inputs["Roughness"].default_value=.34
edge.inputs["Metallic"].default_value=.32
links.new(ramp.outputs[0],edge.inputs["Base Color"])
mix=nodes.new("ShaderNodeMixShader")
links.new(layer.outputs["Fresnel"],mix.inputs[0])
links.new(base.outputs[0],mix.inputs[1])
links.new(edge.outputs[0],mix.inputs[2])
links.new(mix.outputs[0],nodes.get("Material Output").inputs[0])
beak_mat=mat("Matte charcoal keratin",(.032,.033,.031),.74)
eye_mat=mat("Natural dark eye",(.004,.003,.002),.075)
skin=mat("Eyelid and nasal skin",(.018,.018,.017),.68)
gold=mat("Poe Gold · metal only",(.65,.37,.18),.25,1)
silk=mat("Narrow teal silk",(.006,.115,.097),.48)
silk.node_tree.nodes["Principled BSDF"].inputs["Sheen Weight"].default_value=.55
silk.node_tree.nodes["Principled BSDF"].inputs["Sheen Roughness"].default_value=.35
toe_mat=mat("Scaled feet",(.022,.023,.021),.64)


def empty(name, loc=(0,0,0), parent=None):
    o=bpy.data.objects.new(name,None)
    scene.collection.objects.link(o)
    o.location=loc
    o.empty_display_size=.08
    if parent:
        bpy.context.view_layer.update()
        world=o.matrix_world.copy()
        o.parent=parent
        o.matrix_parent_inverse=parent.matrix_world.inverted()
        o.matrix_world=world
    return o


root=empty("Poe · global scale")
body_ctrl=empty("Poe · breathing",(0,0,1.2),root)
head_ctrl=empty("Poe · head pose",(0,-.10,1.99),body_ctrl)


def attach(o, parent=body_ctrl):
    bpy.context.view_layer.update()
    world=o.matrix_world.copy()
    o.parent=parent
    o.matrix_parent_inverse=parent.matrix_world.inverted()
    o.matrix_world=world
    return o


def finish(o,name,material,parent=body_ctrl):
    o.name=name
    o.data.materials.append(material)
    if o.type=="MESH":
        for poly in o.data.polygons:
            poly.use_smooth=True
    if parent:
        attach(o,parent)
    return o


def sphere(name,loc,scale,material=coat,parent=body_ctrl,rotation=(0,0,0)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40,ring_count=24,location=loc)
    o=bpy.context.object
    o.scale=scale
    o.rotation_euler=rotation
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,material,parent)


def mesh(name,verts,faces,material,parent=body_ctrl):
    d=bpy.data.meshes.new(name)
    d.from_pydata(verts,[],faces)
    d.update()
    o=bpy.data.objects.new(name,d)
    scene.collection.objects.link(o)
    return finish(o,name,material,parent)


def tube(name,points,radius,material,parent=body_ctrl):
    d=bpy.data.curves.new(name,"CURVE")
    d.dimensions="3D"
    d.resolution_u=8
    d.bevel_depth=radius
    d.bevel_resolution=3
    sp=d.splines.new("BEZIER")
    sp.bezier_points.add(len(points)-1)
    for p,co in zip(sp.bezier_points,points):
        p.co=co
        p.handle_left_type=p.handle_right_type="AUTO"
    o=bpy.data.objects.new(name,d)
    scene.collection.objects.link(o)
    return finish(o,name,material,parent)


# Four editable hair-curve systems. Each feather is a rachis plus curved barbs.
grooms={name:{"strands":[],"radii":[],"materials":[]} for name in
        ("01 Contour body coat","02 Head, nape and throat hackles",
         "03 Wing coverts","04 Flight feather barbs")}


def strand(group,points,radius,material_index=0):
    g=grooms[group]
    g["strands"].append(points)
    g["radii"].append([radius*(1-.94*i/(len(points)-1)) for i in range(len(points))])
    g["materials"].append(material_index)


def feather(group,surface,theta,phi,length,width,barbs=42,material_index=0):
    jitter=rng.uniform(.82,1.15)
    length*=jitter
    width*=rng.uniform(.80,1.12)
    def point(t,a):
        spread=max(.015,sin(pi*(.13+.87*t))**.65)*(1-.28*t)
        p,n=surface(theta+length*(t+.10*abs(a)*(1-t)),phi+a*width*spread)
        return Vector(p)+Vector(n)*(.005+.017*t+.006*sin(pi*abs(a)))
    strand(group,[point(i/6,0) for i in range(7)],.00125,material_index)
    for i in range(barbs):
        t=.05+.93*(i+rng.uniform(-.13,.13))/barbs
        for side in (-1,1):
            points=[point(t,side*j/4) for j in range(5)]
            strand(group,points,.0011*rng.uniform(.8,1.2),material_index)


def body_surface(t,p):
    x=.409*sin(t)*cos(p)
    y=.414*sin(t)*sin(p)
    z=.705*cos(t)
    n=Vector((x/.409**2,y/.414**2,z/.705**2)).normalized()
    angle=.28
    return ((x,.13+y*cos(angle)-z*sin(angle),1.20+y*sin(angle)+z*cos(angle)),
            (n.x,n.y*cos(angle)-n.z*sin(angle),n.y*sin(angle)+n.z*cos(angle)))


def head_surface(t,p):
    co=Vector((.304*sin(t)*sin(p),-.17-.366*cos(t),2.105+.245*sin(t)*cos(p)))
    n=Vector((co.x/.304**2,(co.y+.17)/.366**2,(co.z-2.105)/.245**2)).normalized()
    return co,n


def throat_surface(t,p):
    co=Vector((.256*sin(t)*cos(p),-.21+.273*sin(t)*sin(p),1.91+.302*cos(t)))
    n=Vector((co.x/.256**2,(co.y+.21)/.273**2,(co.z-1.91)/.302**2)).normalized()
    return co,n


sphere("Body foundation",(0,.13,1.2),(.40,.405,.70),rotation=(.28,0,0))
sphere("Neck foundation",(0,-.075,1.78),(.267,.265,.36))
sphere("Head foundation",(0,-.17,2.105),(.298,.36,.24),parent=head_ctrl)
sphere("Throat foundation",(0,-.21,1.91),(.248,.263,.293),parent=head_ctrl)
for row in range(18):
    for i in range(30):
        feather("01 Contour body coat",body_surface,.19+row*.15+rng.uniform(-.018,.018),
                2*pi*(i+.5*(row%2))/30,.30,.145,48)

eye_centers=[Vector((s*.280,-.325,2.177)) for s in (-1,1)]
for row in range(17):
    for i in range(30):
        t=.25+row*.15
        p=2*pi*(i+.5*(row%2))/30
        co,_=head_surface(t+.08,p)
        if min((co-e).length for e in eye_centers)<.062:
            continue
        feather("02 Head, nape and throat hackles",head_surface,t,p,.36,.12,28,
                1 if co.y>.02 else 0)
for row in range(8):
    for i in range(18):
        feather("02 Head, nape and throat hackles",throat_surface,.35+row*.245,
                -pi+i*pi/17,.52,.16,44)

# Additional free-ended hackles extend beyond the neck volume.
for i in range(130):
    p=rng.uniform(-pi+.3,-.3)
    z=rng.uniform(1.80,2.03)
    start=Vector((.24*cos(p),-.21+.272*sin(p),z))
    end=start+Vector((.025*cos(p),.025*sin(p),-rng.uniform(.10,.23)))
    direction=end-start
    side=Vector((-sin(p),cos(p),0))
    strand("02 Head, nape and throat hackles",[start+direction*j/5 for j in range(6)],.0018)
    for j in range(15):
        t=(j+1)/17
        for sign in (-1,1):
            strand("02 Head, nape and throat hackles",
                   [start+direction*(t+.10*a/3)+side*(sign*.016*sin(pi*t)*a/3) for a in range(4)],.0008)

for s in (-1,1):
    sphere("Wing foundation",(s*.34,.23,1.26),(.151,.375,.574),rotation=(.36,0,0))
    def wing_surface(t,p,s=s):
        y=.385*sin(t)*sin(p)
        z=.586*cos(t)
        n=Vector((s*sin(t)*cos(p)/.16,sin(t)*sin(p)/.385,cos(t)/.586)).normalized()
        return ((s*(.34+.16*sin(t)*cos(p)),.23+y*cos(.36)-z*sin(.36),1.26+y*sin(.36)+z*cos(.36)),
                (n.x,n.y*cos(.36)-n.z*sin(.36),n.y*sin(.36)+n.z*cos(.36)))
    for row in range(11):
        for i in range(15):
            feather("03 Wing coverts",wing_surface,.23+row*.18,
                    -pi/2+(i+.5*(row%2))*.221,.37,.15,56,1)

# Linked, fully volumetric flight-feather meshes. No alpha cards.
verts,faces=[],[]
for layer in (1,-1):
    for i in range(15):
        t=i/14
        w=max(.001,sin(pi*(.08+.92*t))**.65)*(1-.3*t)
        for j in range(5):
            a=2*j/4-1
            verts.append((a*w,t,.028*sin(pi*t)+layer*.003*(1-abs(a)*.6)))
for i in range(14):
    for j in range(4):
        a=i*5+j
        faces.extend([(a,a+1,a+6,a+5),(a+75,a+80,a+81,a+76)])
border=list(range(5))+[i*5+4 for i in range(1,15)]+list(range(73,69,-1))+[i*5 for i in range(13,0,-1)]
for a,b in zip(border,border[1:]+border[:1]):
    faces.append((a,a+75,b+75,b))
flight_data=bpy.data.meshes.new("Shared volumetric flight feather")
flight_data.from_pydata(verts,[],faces)
flight_data.materials.append(coat)
for p in flight_data.polygons:
    p.use_smooth=True
flight_count=0


def flight(name,start,end,width):
    global flight_count
    start,end=Vector(start),Vector(end)
    delta=end-start
    quat=Vector((0,1,0)).rotation_difference(delta.normalized())
    o=bpy.data.objects.new(name,flight_data)
    scene.collection.objects.link(o)
    o.location=start
    o.rotation_mode="QUATERNION"
    o.rotation_quaternion=quat
    o.scale=(width,delta.length,delta.length)
    attach(o)
    def local(t,a):
        w=max(.001,sin(pi*(.08+.92*t))**.65)*(1-.3*t)
        return start+quat@Vector((a*w*width,t*delta.length,(.028*sin(pi*t)+.004)*delta.length))
    strand("04 Flight feather barbs",[local(i/8,0) for i in range(9)],.0016)
    for i in range(95):
        t=.03+.94*i/95
        for s in (-1,1):
            strand("04 Flight feather barbs",[local(t+.065*a/4*(1-t),s*a/4) for a in range(5)],.001)
    flight_count+=1


for s in (-1,1):
    for i in range(10):
        flight("Primary",(s*(.455-.020*i),.27+i*.043,1.21+i*.006),
               (s*(.31-.020*i),.94+i*.027,.22+i*.030),.053)
    for i in range(5):
        flight("Secondary",(s*.47,.12+i*.065,1.36),(s*.41,.66+i*.028,.69),.049)
for i in range(9):
    x=(i-4)*.05
    flight("Wedge tail",(x*.55,.39,.90),(x,1.18+.13*(1-abs(i-4)/4),.15+abs(i-4)*.019),.059)


def bill(name,sections):
    verts,faces=[],[]
    for y,z,w,h in sections:
        for i in range(20):
            a=2*pi*i/20
            verts.append((w*cos(a),y,z+h*sin(a)))
    for row in range(len(sections)-1):
        for i in range(20):
            a=row*20+i
            faces.append((a,row*20+(i+1)%20,(row+1)*20+(i+1)%20,a+20))
    faces.extend([tuple(reversed(range(20))),tuple(range(len(verts)-20,len(verts)))])
    return mesh(name,verts,faces,beak_mat,head_ctrl)


bill("Heavy matte raven bill",[(-.41,2.11,.14,.081),(-.54,2.12,.12,.078),
                             (-.72,2.087,.078,.050),(-.84,2.044,.027,.034),(-.855,2.016,.002,.003)])
bill("Lower mandible",[(-.41,2.032,.127,.026),(-.62,2.024,.087,.026),
                       (-.78,2.017,.036,.014),(-.845,2.015,.002,.003)])
for s in (-1,1):
    sphere("Nostril",(s*.094,-.54,2.165),(.017,.026,.004),skin,head_ctrl)
    for i in range(90):
        start=Vector((s*rng.uniform(.025,.12),rng.uniform(-.49,-.42),rng.uniform(2.13,2.185)))
        end=start+Vector((s*rng.uniform(-.025,.025),-rng.uniform(.04,.12),-rng.uniform(.005,.035)))
        strand("02 Head, nape and throat hackles",[start.lerp(end,j/4) for j in range(5)],.0011)
    n=Vector((s*.92,-.39,0)).normalized()
    center=Vector((s*.280,-.325,2.177))
    rotation=Vector((0,-1,0)).rotation_difference(n).to_euler()
    sphere("Dark natural eye",center,(.038,.017,.037),eye_mat,head_ctrl,rotation)
    up=Vector((0,0,1))
    across=n.cross(up).normalized()
    def lid_point(theta,phi):
        return center+up*(.044*cos(theta))+across*(.044*sin(theta)*sin(phi))+n*(.025*sin(theta)*cos(phi)+.001)
    v,f=[],[]
    for i in range(9):
        for j in range(17):
            v.append(lid_point(.57*i/8,-pi/2+pi*j/16))
    for i in range(8):
        for j in range(16):
            a=i*17+j
            f.append((a,a+1,a+18,a+17))
    lid=mesh("Upper eyelid",v,f,skin,head_ctrl)
    lid.shape_key_add(name="Open")
    close=lid.shape_key_add(name="Blink")
    for i in range(9):
        for j in range(17):
            close.data[i*17+j].co=lid_point(pi*i/8,-pi/2+pi*j/16)
    for frame,value in [(1,0),(32,0),(34,1),(36,0),(74,0),(76,1),(78,0),(97,0)]:
        close.value=value
        close.keyframe_insert("value",frame=frame)

# Hair attributes are kept as native Curves data for editable Cycles strands.
for name,g in grooms.items():
    data=bpy.data.hair_curves.new(name)
    data.add_curves([len(p) for p in g["strands"]])
    data.position_data.foreach_set("vector",[axis for points in g["strands"] for p in points for axis in p])
    radii=data.attributes.new("radius","FLOAT","POINT")
    radii.data.foreach_set("value",[r for strand_radii in g["radii"] for r in strand_radii])
    indices=data.attributes.new("material_index","INT","CURVE")
    indices.data.foreach_set("value",g["materials"])
    data.materials.append(coat)
    data.materials.append(irid)
    obj=bpy.data.objects.new(name,data)
    scene.collection.objects.link(obj)
    attach(obj,head_ctrl if name.startswith("02") else body_ctrl)
    obj["construction"]="Individual curved rachises and barbs; no feather cards"

# Silk and metal remain separate editable objects.
def collar_point(a,t):
    return ((.302+.006*sin(pi*t))*cos(a),-.05+(.354+.006*sin(pi*t))*sin(a),
            1.79-.16*max(0,-sin(a))+.092*t+.004*sin(a*13+t*5))


v=[collar_point(2*pi*i/80,j/8) for i in range(81) for j in range(9)]
f=[]
for i in range(80):
    for j in range(8):
        a=i*9+j
        f.append((a,a+9,a+10,a+1))
collar=mesh("Narrow silk collar",v,f,silk)
solid=collar.modifiers.new("Silk thickness","SOLIDIFY")
solid.thickness=.004
for t in (0,1):
    tube("Thin gold collar trim",[collar_point(2*pi*i/80,t) for i in range(81)],.004,gold)
tube("Locket suspension",[(-.004,-.41,1.64),(-.020,-.44,1.59),(0,-.45,1.565),(.019,-.426,1.61)],.006,gold)
locket=sphere("Small oval gold locket",(0,-.453,1.493),(.059,.018,.080),gold)

# Boolean-cut initial; the letter is an actual recess in the metal.
font=bpy.data.curves.new("Engraving cutter","FONT")
font.body="P"
font.align_x=font.align_y="CENTER"
font.size=.092
font.extrude=.014
font_path=Path("/System/Library/Fonts/Supplemental/Times New Roman.ttf")
if font_path.exists():
    font.font=bpy.data.fonts.load(str(font_path))
cutter=bpy.data.objects.new("P engraving cutter",font)
scene.collection.objects.link(cutter)
cutter.location=(0,-.465,1.494)
cutter.rotation_euler=(pi/2,0,0)
bpy.ops.object.select_all(action="DESELECT")
cutter.select_set(True)
bpy.context.view_layer.objects.active=cutter
bpy.ops.object.convert(target="MESH")
boolean=locket.modifiers.new("Engraved P","BOOLEAN")
boolean.operation="DIFFERENCE"
boolean.object=cutter
bpy.context.view_layer.objects.active=locket
bpy.ops.object.modifier_apply(modifier=boolean.name)
bpy.data.objects.remove(cutter,do_unlink=True)

# Natural foot scales and claws. Feet remain planted during the idle.
for s in (-1,1):
    x=s*.17
    tube("Raven ankle",[(x,.11,.67),(x,.015,.28),(x,-.06,.12)],.025,toe_mat,root)
    for j in range(9):
        z=.14+j*.024
        y=-.05+j*.010
        tube("Ankle scute",[(x-.023,y,z),(x,y-.009,z-.002),(x+.023,y,z)],.003,toe_mat,root)
    for j in range(3):
        end=(x+(j-1)*.102,-.29+abs(j-1)*.04,.06)
        tube("Toe",[(x,-.05,.12),(x+(j-1)*.05,-.16,.078),end],.018,toe_mat,root)
        tube("Claw",[end,(end[0],end[1]-.044,.048),(end[0],end[1]-.058,.015)],.009,beak_mat,root)
    tube("Rear toe",[(x,.025,.12),(x,.14,.066),(x+s*.035,.20,.038)],.016,toe_mat,root)

# Full-size common-raven proportions in meters; old books supply the neutral pose.
root.scale=(.26,.26,.26)
root.location.z=.076
leather=mat("Worn dark leather",(.022,.016,.013),.82)
pages=mat("Aged paper edges",(.18,.16,.13),.88)
for idx,(width,depth,height,angle) in enumerate([(.25,.19,.025,-.05),(.23,.18,.027,.06),(.245,.17,.024,-.025)]):
    z=sum([.025,.027,.024][:idx])+height/2
    bpy.ops.mesh.primitive_cube_add(size=1,location=(0,-.005,z))
    book=bpy.context.object
    book.scale=(width,depth,height*.77)
    book.rotation_euler.z=angle
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    finish(book,"Old book pages",pages,None)
    bevel=book.modifiers.new("Worn edges","BEVEL")
    bevel.width=.0015
    bevel.segments=3
    for side in (-1,1):
        bpy.ops.mesh.primitive_cube_add(size=1,location=(0,-.005,z+side*height*.43))
        cover=bpy.context.object
        cover.scale=(width+.006,depth+.005,.003)
        cover.rotation_euler.z=angle
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        finish(cover,"Dark leather cover",leather,None)
        bevel=cover.modifiers.new("Rounded cover edge","BEVEL")
        bevel.width=.0016
        bevel.segments=3

for frame,amount in [(1,0),(25,1),(49,0),(73,1),(97,0)]:
    body_ctrl.scale=(1+.004*amount,1+.005*amount,1+.006*amount)
    body_ctrl.keyframe_insert("scale",frame=frame)
for frame,tilt in [(1,0),(25,-.012),(49,0),(65,.018),(81,.005),(97,0)]:
    head_ctrl.rotation_euler=(tilt*.3,tilt,tilt*.4)
    head_ctrl.keyframe_insert("rotation_euler",frame=frame)
scene.frame_set(1)

floor_mat=mat("Near-black seamless",(.003,.004,.004),.87)
bpy.ops.mesh.primitive_plane_add(size=200)
finish(bpy.context.object,"Seamless studio",floor_mat,None)


def aim(o,target):
    o.rotation_euler=(Vector(target)-o.location).to_track_quat("-Z","Y").to_euler()


def area(name,loc,power,size,color,target):
    d=bpy.data.lights.new(name,"AREA")
    d.energy,d.size,d.color=power,size,color
    o=bpy.data.objects.new(name,d)
    scene.collection.objects.link(o)
    o.location=loc
    aim(o,target)
    return o


area("Large cool key · upper left",(-.9,-1.25,1.7),110,1.0,(.82,.91,1),(0,0,.42))
rim=area("Thin camera-right rim",(.65,.65,.93),55,.055,(.60,1,.85),(0,.08,.43))
rim.data.shape="RECTANGLE"
rim.data.size_y=.72
warm=area("Warm locket-only light",(.10,-.42,.54),2,.045,(1,.72,.42),(0,-.118,.464))
receivers=bpy.data.collections.new("Warm light receivers · locket only")
receivers.objects.link(locket)
warm.light_linking.receiver_collection=receivers

bpy.ops.object.camera_add(location=(.95,-1.35,.73))
camera=bpy.context.object
camera.name="Hero · 85 mm f4"
camera.data.lens=85
aim(camera,(0,.025,.37))
focus=empty("Focus · near eye",(.0728,-.0845,.642))
camera.data.dof.use_dof=True
camera.data.dof.focus_object=focus
camera.data.dof.aperture_fstop=4
scene.camera=camera
scene.render.image_settings.file_format="PNG"
scene.render.filepath=str(OUT/"poe-hero.png")
scene["mascot_spec"]="docs/poe-mascot-spec.md v2.0.0"
scene["status"]="Photoreal treatment development; visual approval and production optimization pending"
scene["animation"]="4 second idle; body/head transform controls and geometric eyelid shape keys"
scene["older_version"]="../3d/ is preserved and is not overwritten by this generator"
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"poe-photoreal.blend"))
bpy.ops.render.render(write_still=True)
report={"spec_version":"2.0.0","renderer":"Cycles","hair_shape":scene.cycles_curves.shape,
        "hair_systems":{name:len(g["strands"]) for name,g in grooms.items()},
        "curve_points":sum(sum(len(p) for p in g["strands"]) for g in grooms.values()),
        "flight_mesh_instances":flight_count,"body_albedo_linear":.028,
        "lens_mm":85,"f_stop":4,"warm_light_receivers":[o.name for o in receivers.objects],
        "web_export":"Not produced: Cycles hair and angular shaders require a separate real-time treatment."}
(OUT/"build-report.json").write_text(json.dumps(report,indent=2)+"\n")
print("POE_PHOTOREAL_BUILT",json.dumps(report))
