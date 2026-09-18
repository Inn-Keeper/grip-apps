export const nodeIconName = (type: string): string => {
  const map: Record<string, string> = {
    client: "client",
    cdn: "globe",
    lb: "layers",
    gateway: "gateway",
    auth: "shield",
    service: "service",
    worker: "worker",
    queue: "queue",
    cache: "cache",
    sql: "database",
    nosql: "database",
    blob: "cloud",
    search: "search",
    stream: "arrowRight",
    psp: "payment",
    monitor: "monitor",
  };
  return map[type] ?? "service";
};

export const categoryIconName = (name: string): string => {
  const map: Record<string, string> = {
    Languages: "code",
    Frontend: "client",
    Backend: "service",
    Cloud: "cloud",
    Monitoring: "monitor",
    AI: "spark",
    Testing: "test",
    Mobile: "client",
    Databases: "database",
  };
  // Keyed by the first word: category names are "Frontend & Mobile", "AI Tooling", ...
  return map[name.split(" ")[0] ?? name] ?? "spark";
};
