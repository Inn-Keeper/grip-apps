import { addEdge, addNode, patchEdge, patchNode, removeEdge, removeNode } from "../boardEdits.js";

describe("board edits", () => {
  const empty = { nodes: [], edges: [] };
  const two = addNode(addNode(empty, "client", { x: 0, y: 0 }), "service", { x: 200, y: 0 });
  const [a, b] = two.nodes;

  it("adds nodes with unique ids", () => {
    expect(two.nodes.map((n) => n.type)).toEqual(["client", "service"]);
    expect(a.id).not.toBe(b.id);
  });

  it("refuses self and duplicate arrows by returning the same board", () => {
    const linked = addEdge(two, a.id, b.id);
    expect(linked.edges).toHaveLength(1);
    expect(addEdge(linked, a.id, b.id)).toBe(linked);
    expect(addEdge(linked, a.id, a.id)).toBe(linked);
  });

  it("connects free boxes but never free text or free arrows", () => {
    const withFree = addNode(addNode(addNode(two, "box", { x: 0, y: 100 }), "text", { x: 0, y: 200 }), "arrow", { x: 0, y: 300 }, { x2: 90, y2: 300 });
    const [, , box, text, arrow] = withFree.nodes;
    expect(arrow).toMatchObject({ x: 0, y: 300, x2: 90, y2: 300 });
    expect(addEdge(withFree, box.id, a.id).edges).toHaveLength(1);
    expect(addEdge(withFree, a.id, text.id)).toBe(withFree);
    expect(addEdge(withFree, text.id, box.id)).toBe(withFree);
    expect(addEdge(withFree, arrow.id, a.id)).toBe(withFree);
  });

  it("removes a node together with its arrows", () => {
    const linked = addEdge(two, a.id, b.id);
    expect(removeNode(linked, a.id)).toEqual({ nodes: [b], edges: [] });
  });

  it("patches and removes by id", () => {
    const linked = addEdge(two, a.id, b.id);
    const edgeId = linked.edges[0].id;
    expect(patchNode(linked, a.id, { replicas: 3 }).nodes[0].replicas).toBe(3);
    expect(patchEdge(linked, edgeId, { mode: "async" }).edges[0].mode).toBe("async");
    expect(removeEdge(linked, edgeId).edges).toEqual([]);
  });
});
