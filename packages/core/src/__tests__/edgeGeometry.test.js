import { distanceToEdge, edgeGeometry } from "../edgeGeometry.js";

describe("edge geometry", () => {
  const size = { width: 100, height: 40 };
  it("leaves from the side facing the target", () => {
    expect(edgeGeometry({ x: 0, y: 0 }, { x: 300, y: 0 }, size)).toMatchObject({ sx: 100, tx: 300, sy: 20 });
    expect(edgeGeometry({ x: 300, y: 0 }, { x: 0, y: 0 }, size)).toMatchObject({ sx: 300, tx: 100 });
  });
  it("measures a tap on the curve as zero distance", () => {
    const g = edgeGeometry({ x: 0, y: 0 }, { x: 300, y: 0 }, size);
    expect(distanceToEdge(g, g.sx, g.sy)).toBe(0);
  });
});
