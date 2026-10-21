import { arrowheadPath, bezierPath, distanceToEdge, edgeGeometry, headPoints } from "../edgeGeometry.js";

describe("edge geometry", () => {
  const size = { width: 100, height: 40 };
  it("leaves from the side facing the target", () => {
    expect(edgeGeometry({ x: 0, y: 0 }, { x: 300, y: 0 }, size)).toMatchObject({ sx: 100, tx: 300, sy: 20 });
    expect(edgeGeometry({ x: 300, y: 0 }, { x: 0, y: 0 }, size)).toMatchObject({ sx: 300, tx: 100 });
  });
  it("lands on the middle of a bigger target", () => {
    expect(edgeGeometry({ x: 0, y: 0 }, { x: 300, y: 0 }, size, { width: 200, height: 80 })).toMatchObject({ tx: 300, ty: 40, sy: 20 });
    expect(edgeGeometry({ x: 600, y: 0 }, { x: 0, y: 0 }, size, { width: 200, height: 80 })).toMatchObject({ tx: 200 });
  });
  it("connects top to bottom when one node sits above the other", () => {
    const down = edgeGeometry({ x: 0, y: 0 }, { x: 20, y: 300 }, size);
    expect(down).toMatchObject({ vertical: true, sx: 50, sy: 40, tx: 70, ty: 300 });
    expect(edgeGeometry({ x: 0, y: 300 }, { x: 0, y: 0 }, size)).toMatchObject({ vertical: true, sy: 300, ty: 40 });
    // Bends vertically: control points halfway down, under each end.
    expect(bezierPath(down)).toBe("M 50 40 C 50 170 70 170 70 300");
    // The head points down onto the target's top edge.
    expect(arrowheadPath(down)).toBe("M 70 300 L 65 291 L 75 291 Z");
  });

  it("keeps side to side when the nodes overlap vertically", () => {
    expect(edgeGeometry({ x: 0, y: 0 }, { x: 300, y: 30 }, size).vertical).toBe(false);
  });

  it("measures a tap on the curve as zero distance", () => {
    const g = edgeGeometry({ x: 0, y: 0 }, { x: 300, y: 0 }, size);
    expect(distanceToEdge(g, g.sx, g.sy)).toBe(0);
  });
});

describe("headPoints", () => {
  it("points a free arrow's head along the line, tip first", () => {
    expect(headPoints({ x: 0, y: 0 }, { x: 20, y: 0 })).toBe("20,0 10,5 10,-5");
  });
});
