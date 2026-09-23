// Interview prep content. Each item: tech, oneliner, prep (bullet notes),
// quiz (correct answer is always index 0 in source — options are shuffled at runtime).

export const categories = [
  {
    name: "Languages",
    emoji: "🧠",
    color: "#818CF8",
    items: [
      {
        tech: "TypeScript",
        oneliner: "JavaScript with a type system that catches bugs before runtime.",
        prep: [
          "Structural typing: compatibility is by shape, not by declared name",
          "unknown forces a check before use; any opts out of the type system",
          "Utility types: Partial, Pick, Omit, Record, ReturnType",
          "Generics with constraints (extends); discriminated unions for state modeling",
          "Be ready to argue the TS-over-JS case for team codebases",
        ],
        quiz: [
          {
            question: "What is the key difference between unknown and any in TypeScript?",
            options: [
              "unknown requires a type check before use; any bypasses type checking entirely",
              "any is only for primitives; unknown also works with objects",
              "unknown throws at runtime when misused; any fails silently",
              "any is deprecated in strict mode; unknown is its replacement",
            ],
            correct: 0,
          },
          {
            question: "Which utility type creates a new type with all properties set to optional?",
            options: ["Partial<T>", "Pick<T, K>", "Omit<T, K>", "Required<T>"],
            correct: 0,
          },
          {
            question: "What is a discriminated union?",
            options: [
              "A union with a shared literal property used as a type guard",
              "A union that excludes null and undefined from its members",
              "A union narrowed automatically by the order of its members",
              "A union type where all members must share every property",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "JavaScript",
        oneliner: "The language of the web: event-driven, single-threaded, prototype-based.",
        prep: [
          "Event loop: call stack, microtasks (Promises) drain before macrotasks (setTimeout)",
          "Closures and lexical scope; the classic loop-variable pitfall",
          "this binding rules: default, implicit, explicit (call/bind), arrow functions",
          "Promises vs async/await; error handling in async chains",
          "ES2020+: optional chaining, nullish coalescing, dynamic import",
        ],
        quiz: [
          {
            question: "In the JavaScript event loop, which queue has higher priority?",
            options: [
              "Microtasks (Promises): drained fully before the next macrotask (setTimeout)",
              "Macrotasks (setTimeout): they were queued by the host first",
              "Neither: tasks run strictly in the order they were queued",
              "Whichever queue currently holds more pending tasks",
            ],
            correct: 0,
          },
          {
            question: "What does the nullish coalescing operator (??) return?",
            options: [
              "The right-hand side only when the left side is null or undefined",
              "The right-hand side when the left side is any falsy value",
              "The left-hand side only when both sides are defined",
              "undefined when either operand is null",
            ],
            correct: 0,
          },
          {
            question: "What is a closure in JavaScript?",
            options: [
              "A function that retains access to its lexical scope even when run outside it",
              "A function whose variables are frozen at the moment it is defined",
              "An immediately invoked function expression that hides its variables",
              "A function permanently bound to a specific this context",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "Java",
        oneliner: "Strongly typed, OOP-first language powering enterprise backends and Android.",
        prep: [
          "SOLID principles with concrete examples ready",
          "Interfaces (multiple, default methods) vs abstract classes (single, can hold state)",
          "Streams API and lambdas; generics and type erasure",
          "Concurrency: executors, synchronized vs volatile",
          "Spring Boot: DI, auto-configuration, starters (if the role touches it)",
        ],
        quiz: [
          {
            question: "What is the key difference between an interface and an abstract class in Java?",
            options: [
              "A class can implement many interfaces but extend only one abstract class",
              "Abstract classes cannot contain any implemented methods",
              "Interfaces can hold instance state; abstract classes cannot",
              "Abstract classes cannot declare abstract methods since Java 8",
            ],
            correct: 0,
          },
          {
            question: "Which SOLID principle states that a class should have only one reason to change?",
            options: [
              "Single Responsibility Principle",
              "Open/Closed Principle",
              "Liskov Substitution Principle",
              "Interface Segregation Principle",
            ],
            correct: 0,
          },
          {
            question: "What does the volatile keyword guarantee in Java concurrency?",
            options: [
              "Reads and writes to the variable are visible across threads",
              "Only one thread can access the variable at a time",
              "Compound operations like x++ on the variable are atomic",
              "The variable is excluded from garbage collection",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "PHP",
        oneliner: "Server-side scripting language that still powers most of the web.",
        prep: [
          "PSR standards and Composer autoloading",
          "PHP 8: named arguments, enums, attributes, match expressions, fibers",
          "REST APIs with Laravel or Slim; middleware pipeline",
          "Classic gotchas: loose comparisons (== vs ===), array functions",
        ],
        quiz: [
          {
            question: "What do PHP PSR standards primarily define?",
            options: [
              "Coding style and interoperability rules for PHP packages",
              "Security requirements for PHP web applications",
              "The official specification of the PHP runtime",
              "Performance benchmarks PHP frameworks must meet",
            ],
            correct: 0,
          },
          {
            question: "What are PHP 8 Fibers?",
            options: [
              "Lightweight coroutines enabling cooperative multitasking in one thread",
              "OS threads PHP spawns for parallel request handling",
              "Streams optimized for large file uploads",
              "Lazy-loaded class definitions that cut memory usage",
            ],
            correct: 0,
          },
          {
            question: "Which PHP 8 feature allows passing arguments by name regardless of order?",
            options: ["Named arguments", "Attributes", "Match expressions", "Constructor promotion"],
            correct: 0,
          },
        ],
      },
      {
        tech: "Python",
        oneliner: "Readable, batteries-included language dominating scripting and AI/ML.",
        prep: [
          "List comprehensions and generators (lazy evaluation, memory)",
          "Decorators and context managers",
          "Type hints and dataclasses",
          "asyncio: event loop, await, and when threads beat async",
          "AI-adjacent: pandas basics, FastAPI, calling LLM APIs",
        ],
        quiz: [
          {
            question: "What makes Python generators memory-efficient compared to lists?",
            options: [
              "They yield values one at a time instead of building the whole collection",
              "They store values in a compressed binary format",
              "They share one buffer across all iterations",
              "They release each value's memory before the next is computed",
            ],
            correct: 0,
          },
          {
            question: "What is a Python decorator?",
            options: [
              "A function that wraps another function to extend its behavior",
              "A class attribute that controls instance creation",
              "An annotation that enforces argument types at runtime",
              "A compiler directive that optimizes the decorated function",
            ],
            correct: 0,
          },
          {
            question: "In Python async I/O, what does await do?",
            options: [
              "Suspends the coroutine until the awaitable completes, yielding to the event loop",
              "Blocks the main thread until the result is ready",
              "Moves the awaited call onto a background OS thread",
              "Retries the awaited operation until it succeeds",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "C++",
        oneliner: "Systems-level language with manual memory control and zero-overhead abstractions.",
        prep: [
          "RAII: resource lifetime tied to object scope",
          "Smart pointers: unique_ptr (sole owner) vs shared_ptr (ref-counted)",
          "Rule of three/five; move semantics and rvalue references",
          "STL containers and iterators; complexity guarantees",
          "Relevant for audio/DSP and plugin contexts",
        ],
        quiz: [
          {
            question: "What does RAII stand for and what problem does it solve?",
            options: [
              "Resource Acquisition Is Initialization: ties resource lifetime to scope, preventing leaks",
              "Runtime Allocation Is Implicit: heap allocation without explicit new",
              "Reference Aliasing Is Invalid: a rule preventing dangling references",
              "Resource Access Is Immediate: guarantees lock-free access to resources",
            ],
            correct: 0,
          },
          {
            question: "What is the difference between std::unique_ptr and std::shared_ptr?",
            options: [
              "unique_ptr has sole ownership and can't be copied; shared_ptr reference-counts shared owners",
              "unique_ptr lives on the stack while shared_ptr always allocates on the heap",
              "shared_ptr is faster because it avoids ownership bookkeeping",
              "unique_ptr is for arrays; shared_ptr is for single objects",
            ],
            correct: 0,
          },
          {
            question: "What does move semantics (rvalue references) enable?",
            options: [
              "Transferring resource ownership without copying, avoiding deep copies",
              "Passing arguments by reference without the address-of operator",
              "Relocating objects in memory to reduce fragmentation",
              "Sharing one object between threads without synchronization",
            ],
            correct: 0,
          },
        ],
      },
    ],
  },
  {
    name: "Frontend & Mobile",
    emoji: "🖥️",
    color: "#38BDF8",
    items: [
      {
        tech: "React",
        oneliner: "Component-based UI library built around declarative rendering and a virtual DOM.",
        prep: [
          "Hooks: useState, useEffect, useCallback, useMemo, useRef, and when each matters",
          "Reconciliation and keys; what actually triggers re-renders",
          "Lifting state vs context vs external stores",
          "Performance: memoization, list virtualization, avoiding effect misuse",
          "Patterns: compound components, custom hooks",
        ],
        quiz: [
          {
            question: "When should you use useCallback?",
            options: [
              "To keep a function reference stable across renders, e.g. for memoized children",
              "To cache the return value of an expensive calculation",
              "To run a side effect only when its dependencies change",
              "To hold a mutable value that doesn't trigger re-renders",
            ],
            correct: 0,
          },
          {
            question: "What triggers React's reconciliation algorithm?",
            options: [
              "State or prop changes that cause a component to re-render",
              "Direct DOM mutations made through refs",
              "Browser layout and repaint events",
              "Changes to module-level variables a component reads",
            ],
            correct: 0,
          },
          {
            question: "What is the main trade-off of using React Context for state?",
            options: [
              "Every consumer re-renders whenever the context value changes",
              "Context values reset on every route navigation",
              "Context can only pass primitives, not objects or functions",
              "Context is unavailable during server-side rendering",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "React Native",
        oneliner: "Write once in React, ship native apps to iOS and Android.",
        prep: [
          "Old bridge vs JSI / new architecture (Fabric, TurboModules)",
          "Platform-specific code: Platform.OS and .ios.js/.android.js files",
          "React Navigation; Metro bundler",
          "Full release pipeline to both stores; OTA updates",
        ],
        quiz: [
          {
            question: "What problem does JSI solve compared to the old Bridge?",
            options: [
              "Synchronous, direct JS-to-native calls without JSON serialization overhead",
              "Automatic code sharing between React web and React Native",
              "Native modules written in JavaScript instead of Swift/Kotlin",
              "Smaller app binaries by lazy-loading native modules",
            ],
            correct: 0,
          },
          {
            question: "How do you write platform-specific code in React Native?",
            options: [
              "Platform.OS checks or .ios.js/.android.js file extensions",
              "CSS-style media queries scoped to the platform",
              "Separate entry points configured in app.json",
              "Conditional imports based on process.env.PLATFORM",
            ],
            correct: 0,
          },
          {
            question: "What is the role of the Metro bundler?",
            options: [
              "Bundles JS and assets for the native app, with fast refresh in development",
              "Compiles JavaScript into native ARM bytecode",
              "Links native iOS and Android dependencies automatically",
              "Splits the app into over-the-air updatable chunks",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "Next.js",
        oneliner: "React framework for production: SSR, SSG, App Router, and edge rendering baked in.",
        prep: [
          "App Router vs Pages Router; file-based routing",
          "Server Components vs Client Components ('use client')",
          "Data fetching and caching: revalidation, static vs dynamic rendering",
          "Middleware on the Edge; deployment on Vercel",
        ],
        quiz: [
          {
            question: "What is the primary advantage of React Server Components?",
            options: [
              "They run on the server, cutting client bundle size and allowing direct data access",
              "They stream real-time updates to the client over WebSockets",
              "They cache rendered HTML in the browser between navigations",
              "They eliminate hydration entirely for the whole page",
            ],
            correct: 0,
          },
          {
            question: "When would you use generateStaticParams?",
            options: [
              "To pre-generate dynamic route segments at build time for SSG",
              "To validate query parameters before a page renders",
              "To declare which params middleware is allowed to rewrite",
              "To generate typed route helpers for client navigation",
            ],
            correct: 0,
          },
          {
            question: "Where does Next.js middleware run?",
            options: [
              "On the Edge Runtime, before the request reaches the page or API route",
              "In the browser, before each client-side navigation",
              "On the Node server, after the response is generated",
              "Inside each Server Component during rendering",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "TanStack",
        oneliner: "Headless, framework-agnostic utilities: primarily React Query for server state.",
        prep: [
          "Server state vs client state: why they need different tools",
          "Query keys drive caching and refetching",
          "stale-while-revalidate lifecycle: fresh, stale, refetch triggers",
          "Mutations with optimistic updates and invalidation",
          "How it replaces Redux for async data",
        ],
        quiz: [
          {
            question: "What is stale-while-revalidate in React Query?",
            options: [
              "Show cached data immediately while fetching fresh data in the background",
              "Block rendering until the cache is confirmed fresh",
              "Serve stale data only when the network request fails",
              "Revalidate the cache on a fixed interval regardless of usage",
            ],
            correct: 0,
          },
          {
            question: "Why are query keys important in React Query?",
            options: [
              "They identify cached queries and trigger refetches when they change",
              "They encrypt cached data per user session",
              "They define the retry order for failed requests",
              "They map queries to REST endpoints automatically",
            ],
            correct: 0,
          },
          {
            question: "When is React Query a better fit than Redux?",
            options: [
              "For server state: it handles caching, deduplication, and refetching out of the box",
              "For complex synchronous state transitions shared across the app",
              "When you need time-travel debugging of state changes",
              "When state must persist across page reloads",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "Redux",
        oneliner: "Predictable state container with a unidirectional data flow.",
        prep: [
          "Actions, reducers, selectors; unidirectional flow",
          "Redux Toolkit: createSlice, Immer-based updates",
          "Middleware: thunk vs saga for side effects",
          "When Redux earns its weight: large teams, complex shared state",
        ],
        quiz: [
          {
            question: "What is the purpose of Redux middleware like redux-thunk?",
            options: [
              "Intercept dispatched actions to handle side effects like async API calls",
              "Validate that reducers never mutate state directly",
              "Batch multiple dispatches into a single store update",
              "Synchronize the store across browser tabs",
            ],
            correct: 0,
          },
          {
            question: "What does Redux Toolkit's createSlice provide?",
            options: [
              "Auto-generated actions and reducers with Immer-based immutable updates",
              "Lazy-loaded store segments for code splitting",
              "Memoized selectors scoped to the slice",
              "Built-in persistence of the slice to localStorage",
            ],
            correct: 0,
          },
          {
            question: "When is Redux likely overkill?",
            options: [
              "Small apps where component state or Context covers the sharing needs",
              "Apps where several distant components edit the same data",
              "Apps that need a full audit trail of state changes",
              "Teams larger than a handful of engineers",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "Tailwind",
        oneliner: "Utility-first CSS framework: style directly in markup, no custom class names needed.",
        prep: [
          "JIT engine: only classes found in source files are generated",
          "Responsive prefixes (md:), dark mode, state variants (hover:)",
          "Arbitrary values like w-[347px]; extending the theme config",
          "Be ready to defend utility-first vs BEM / CSS Modules",
        ],
        quiz: [
          {
            question: "What does Tailwind's JIT engine do?",
            options: [
              "Generates only the classes used in your source files, keeping CSS tiny",
              "Compiles utility classes to inline styles at runtime",
              "Pre-builds every possible class into one cached stylesheet",
              "Removes unused classes from third-party CSS libraries",
            ],
            correct: 0,
          },
          {
            question: "How do you apply a style only on medium screens and above?",
            options: [
              "Prefix the class with md:, e.g. md:text-lg",
              "Wrap the element in a <Screen size=\"md\"> helper",
              "Use the responsive() function in tailwind.config.js",
              "Add a data-screen=\"md\" attribute to the element",
            ],
            correct: 0,
          },
          {
            question: "How do you use a one-off value that isn't in Tailwind's scale?",
            options: [
              "Arbitrary values in square brackets, e.g. w-[347px]",
              "The closest scale value plus a calc() modifier",
              "A @layer utilities rule in the global stylesheet",
              "The style attribute: Tailwind has no escape hatch for this",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "Material UI",
        oneliner: "Google's Material Design implemented as a rich React component library.",
        prep: [
          "Theme system: palette, typography, spacing tokens",
          "sx prop vs styled(): quick overrides vs reusable components",
          "Global component overrides via theme.components",
          "Know when MUI accelerates you vs fights your design",
        ],
        quiz: [
          {
            question: "What is the MUI sx prop?",
            options: [
              "A CSS-in-JS prop accepting theme-aware style values on any MUI component",
              "A shorthand for spreading multiple props onto a component",
              "A prop that toggles strict accessibility checks",
              "A scoped stylesheet attached to the component's shadow DOM",
            ],
            correct: 0,
          },
          {
            question: "How do you globally override an MUI component's default styles?",
            options: [
              "theme.components[ComponentName].styleOverrides in the theme",
              "A GlobalStyles component with !important rules",
              "Re-exporting the component wrapped in withStyles",
              "Setting defaultProps.style on the component class",
            ],
            correct: 0,
          },
          {
            question: "When does MUI slow you down?",
            options: [
              "When the design deviates far from Material Design, forcing heavy overrides",
              "When the app needs server-side rendering",
              "When more than one theme is used in the same app",
              "When components must be accessible to screen readers",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "Vite",
        oneliner: "Lightning-fast dev server and bundler using native ESM and Rollup under the hood.",
        prep: [
          "Dev speed: native ESM, no bundling on startup; esbuild pre-bundles deps",
          "Production builds via Rollup",
          "Env vars need the VITE_ prefix to reach client code",
          "Config: aliases, plugins, build options",
        ],
        quiz: [
          {
            question: "Why is Vite's dev server faster than Webpack's?",
            options: [
              "It serves source files as native ES modules without bundling first",
              "It compiles the whole app ahead of time and caches it on disk",
              "It runs the bundler in a worker pool across all CPU cores",
              "It skips source maps and type checking in development",
            ],
            correct: 0,
          },
          {
            question: "How do you expose environment variables to client code in Vite?",
            options: [
              "Prefix them with VITE_ in your .env file",
              "List them in an envWhitelist array in vite.config.js",
              "Import them from the virtual module vite:env",
              "All .env variables are exposed to the client automatically",
            ],
            correct: 0,
          },
          {
            question: "What bundler does Vite use for production builds?",
            options: ["Rollup", "esbuild", "Webpack", "SWC"],
            correct: 0,
          },
        ],
      },
      {
        tech: "Rspack",
        oneliner: "Webpack-compatible Rust-based bundler: drop-in replacement, 10× faster.",
        prep: [
          "Rust-based and parallel: roughly 10× Webpack build speed",
          "Drop-in Webpack API compatibility for most configs and loaders",
          "Migration consideration: when Webpack compatibility beats switching to Vite",
        ],
        quiz: [
          {
            question: "What is the primary reason Rspack is faster than Webpack?",
            options: [
              "It's written in Rust, enabling real parallelism beyond JS's single thread",
              "It bundles only changed files and stitches them at runtime",
              "It drops CommonJS support to simplify module resolution",
              "It offloads transforms to a cloud build cache",
            ],
            correct: 0,
          },
          {
            question: "What is Rspack's compatibility story with Webpack?",
            options: [
              "Near drop-in: most Webpack configs and loaders work with minor exceptions",
              "Configs must be converted with an official migration CLI first",
              "Loaders are compatible but the plugin API is entirely different",
              "Only Webpack 4 configs are supported, not Webpack 5",
            ],
            correct: 0,
          },
          {
            question: "When would you choose Rspack over Vite?",
            options: [
              "Migrating a large Webpack config where API compatibility matters most",
              "Starting a greenfield project with no legacy constraints",
              "When dev-server startup time is the only bottleneck",
              "When the project must avoid Rust toolchain dependencies",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "Webpack",
        oneliner: "The veteran module bundler: highly configurable, powers most legacy frontends.",
        prep: [
          "Loaders transform files; plugins hook the build lifecycle",
          "Code splitting, tree shaking, chunk strategy",
          "Module Federation for micro-frontends",
          "Perf pitfalls; when to migrate to Vite or Rspack",
        ],
        quiz: [
          {
            question: "What is the difference between Webpack loaders and plugins?",
            options: [
              "Loaders transform individual files; plugins hook into the build lifecycle",
              "Plugins transform files; loaders configure output format",
              "Loaders run in development only; plugins run in production builds",
              "Loaders are built in; plugins always come from third parties",
            ],
            correct: 0,
          },
          {
            question: "What is Module Federation in Webpack 5?",
            options: [
              "Separate builds sharing code at runtime: the micro-frontend enabler",
              "Splitting one bundle into chunks loaded on demand",
              "Deduplicating identical modules across entry points",
              "Composing multiple webpack configs into a single build",
            ],
            correct: 0,
          },
          {
            question: "What does tree shaking eliminate?",
            options: [
              "Unused exports from ES modules in the final bundle",
              "Duplicate packages in the dependency tree",
              "Dead branches inside functions via static analysis",
              "Unreferenced assets like images and fonts",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "pnpm / Corepack",
        oneliner: "Fast, disk-efficient package manager with strict node_modules and workspace support.",
        prep: [
          "Content-addressable global store; hard links save disk space",
          "Strict, non-flat node_modules: no phantom dependencies",
          "Workspaces for monorepos",
          "Corepack pins the package manager via the packageManager field",
        ],
        quiz: [
          {
            question: "How does pnpm save disk space compared to npm?",
            options: [
              "One global content-addressable store, hard-linked into each project",
              "Compressing node_modules into archives extracted on demand",
              "Installing only direct dependencies and resolving the rest lazily",
              "Sharing a single node_modules folder across all projects",
            ],
            correct: 0,
          },
          {
            question: "How does pnpm's node_modules differ from npm's flat hoisting?",
            options: [
              "Strict non-flat layout: packages only see their declared dependencies",
              "Fully flat layout with conflicts resolved by version pinning",
              "No node_modules at all: modules load from the global store path",
              "Identical layout, but populated via symlinks for speed",
            ],
            correct: 0,
          },
          {
            question: "What does Corepack do?",
            options: [
              "Pins the package manager version per project via the packageManager field",
              "Verifies package integrity against a signed registry manifest",
              "Bridges pnpm workspaces with npm-based CI runners",
              "Caches package tarballs for offline installs",
            ],
            correct: 0,
          },
        ],
      },
    ],
  },
  {
    name: "Backend",
    emoji: "⚙️",
    color: "#4ADE80",
    items: [
      {
        tech: "Node.js",
        oneliner: "JavaScript runtime on the server: event-driven, non-blocking I/O.",
        prep: [
          "Event loop phases; microtasks vs timers vs I/O callbacks",
          "Streams and backpressure",
          "Worker threads for CPU-bound work; cluster for multi-core HTTP",
          "Gotchas: blocking the loop, unhandled rejections",
          "How Node compares with Deno and Bun",
        ],
        quiz: [
          {
            question: "Why is Node.js described as non-blocking I/O?",
            options: [
              "I/O is offloaded to libuv/the OS; the event loop continues and a callback fires on completion",
              "Each I/O operation gets its own lightweight thread from a pool",
              "I/O results are streamed in chunks so nothing waits for full payloads",
              "The runtime pauses only the calling function, not the whole process",
            ],
            correct: 0,
          },
          {
            question: "When would you use Node.js Worker Threads?",
            options: [
              "CPU-intensive work that would otherwise block the event loop",
              "Handling more concurrent HTTP connections per process",
              "Isolating database queries from application code",
              "Running scheduled background jobs on a timer",
            ],
            correct: 0,
          },
          {
            question: "What is a common Node.js performance gotcha?",
            options: [
              "CPU-heavy synchronous code on the main thread stalling the event loop",
              "Too many awaits in sequence exhausting the Promise pool",
              "Streams consuming more memory than buffering the full payload",
              "The garbage collector pausing all I/O during collection",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "NestJS",
        oneliner: "Opinionated Node.js framework using decorators and modules: Angular-inspired.",
        prep: [
          "Modules, controllers, providers; the DI container",
          "Request lifecycle: guards → interceptors → pipes → handler → filters",
          "Integration with TypeORM or Prisma",
          "When Nest beats Express: conventions, testability, team scale",
        ],
        quiz: [
          {
            question: "What is the role of a NestJS Guard?",
            options: [
              "Decides whether a request may reach a route: typically auth checks",
              "Transforms and validates the request payload",
              "Catches exceptions and shapes the error response",
              "Wraps the handler to add logging or caching",
            ],
            correct: 0,
          },
          {
            question: "How does NestJS Dependency Injection work?",
            options: [
              "Providers registered in modules are instantiated and injected into constructors",
              "A global service locator resolves dependencies at call time",
              "Decorators rewrite imports to singleton instances at compile time",
              "Each request builds a fresh dependency graph from scratch",
            ],
            correct: 0,
          },
          {
            question: "When would you choose NestJS over plain Express?",
            options: [
              "When you want conventions, built-in DI, and structure for a larger team",
              "When raw request throughput is the top priority",
              "When the service is a thin proxy with no business logic",
              "When avoiding decorators and metadata reflection is required",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "GraphQL (Relay)",
        oneliner: "Query language for APIs that gives clients exactly the data they need.",
        prep: [
          "Schema, resolvers, and the N+1 problem (DataLoader batching)",
          "Fragments and colocated data requirements",
          "Relay connection spec: edges, node, pageInfo, cursors",
          "When REST is the better fit",
        ],
        quiz: [
          {
            question: "What is the N+1 problem and how does DataLoader solve it?",
            options: [
              "A list of N items triggers N extra queries for relations; DataLoader batches them into one",
              "Each query level adds one network round trip; DataLoader flattens the query tree",
              "Resolvers re-run N+1 times on cache misses; DataLoader memoizes them",
              "Pagination over-fetches one extra page; DataLoader trims the cursor window",
            ],
            correct: 0,
          },
          {
            question: "What does the Relay connections spec define?",
            options: [
              "Cursor-based pagination with edges, node, and pageInfo",
              "How subscriptions multiplex over a single WebSocket",
              "Normalized client-cache keys for every object type",
              "Batching rules for combining queries into one request",
            ],
            correct: 0,
          },
          {
            question: "When is REST a better fit than GraphQL?",
            options: [
              "Simple stable APIs with few clients, where HTTP caching pays off",
              "When clients need flexible, nested data selection",
              "When many teams share one evolving API surface",
              "When the schema changes frequently during development",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "REST / OpenAPI",
        oneliner: "Standard HTTP API paradigm: stateless, resource-based, documented with OpenAPI specs.",
        prep: [
          "REST constraints: statelessness, uniform interface, cacheability",
          "Correct verbs and status codes (201, 204, 409, 422)",
          "Versioning strategies: URI, header, content negotiation",
          "Contract-first with OpenAPI: codegen for servers and clients",
        ],
        quiz: [
          {
            question: "What status code should a successful POST that creates a resource return?",
            options: ["201 Created", "200 OK", "202 Accepted", "204 No Content"],
            correct: 0,
          },
          {
            question: "What is contract-first API design with OpenAPI?",
            options: [
              "Write the spec first; generate server stubs and client SDKs from it",
              "Generate the spec automatically from implemented route handlers",
              "Negotiate the contract per client via content types",
              "Derive the API surface from the database schema",
            ],
            correct: 0,
          },
          {
            question: "Which REST constraint most enables horizontal scaling?",
            options: [
              "Statelessness: any server can handle any request without session affinity",
              "Cacheability: responses can be stored by intermediaries",
              "Layered system: proxies can be inserted transparently",
              "Uniform interface: clients need no server-specific logic",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "Microservices",
        oneliner: "Architectural style where a system is split into small, independently deployable services.",
        prep: [
          "Sync (HTTP/gRPC) vs async (events/queues) communication",
          "Eventual consistency, sagas, outbox pattern",
          "Service discovery, distributed tracing, circuit breakers",
          "Premature decomposition: the distributed monolith trap",
        ],
        quiz: [
          {
            question: "What is eventual consistency in a microservices context?",
            options: [
              "Data across services converges over time via events but may be briefly out of sync",
              "All services commit changes in one distributed transaction",
              "Reads always return the latest write once a quorum acknowledges",
              "Conflicting writes are resolved by the most recent timestamp",
            ],
            correct: 0,
          },
          {
            question: "What is the main advantage of async messaging over synchronous HTTP between services?",
            options: [
              "Temporal decoupling: producers don't wait on consumers, improving resilience",
              "Stronger delivery guarantees than HTTP can provide",
              "Lower end-to-end latency for individual requests",
              "Messages are automatically encrypted in transit",
            ],
            correct: 0,
          },
          {
            question: "What is the main pitfall of premature microservice decomposition?",
            options: [
              "Distributed-system complexity before domain boundaries are understood",
              "Services that are too small to justify separate repositories",
              "Higher infrastructure cost from running many small instances",
              "Slower CI pipelines due to many independent builds",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "Auth & Security",
        oneliner: "OAuth2, OIDC, JWTs, and OWASP basics: where every API design interview eventually goes.",
        prep: [
          "OAuth2 flows: authorization code (+ PKCE) for users, client credentials for service-to-service",
          "OIDC adds an identity layer (ID token) on top of OAuth2",
          "JWTs are signed, not encrypted: validate signature, expiry, issuer, audience; keep them short-lived",
          "Session vs token auth tradeoffs; refresh token rotation",
          "OWASP top risks: injection, broken auth, XSS, CSRF, and the standard mitigations",
        ],
        quiz: [
          {
            question: "What is the relationship between OAuth2 and OIDC?",
            options: [
              "OIDC is an identity layer on top of OAuth2: it adds an ID token saying who the user is",
              "OAuth2 handles authentication; OIDC adds authorization scopes",
              "OIDC is the successor protocol that replaces OAuth2",
              "OAuth2 is for web apps; OIDC is the mobile-only variant",
            ],
            correct: 0,
          },
          {
            question: "What must a server verify when accepting a JWT?",
            options: [
              "Signature, expiry, issuer, and audience: decoding alone proves nothing",
              "That the payload decrypts with the server's private key",
              "That the token ID exists in the server's session store",
              "That the claims match the user record in the database",
            ],
            correct: 0,
          },
          {
            question: "Which OAuth2 flow should a single-page app use today?",
            options: [
              "Authorization code with PKCE: the implicit flow is deprecated",
              "Implicit flow, since a SPA cannot keep a client secret",
              "Client credentials, since the SPA is the OAuth client",
              "Resource owner password flow with the user's credentials",
            ],
            correct: 0,
          },
        ],
      },
    ],
  },
  {
    name: "Cloud & DevOps",
    emoji: "☁️",
    color: "#FBBF24",
    items: [
      {
        tech: "Azure DevOps",
        oneliner: "Microsoft's end-to-end platform for repos, CI/CD pipelines, boards, and artifacts.",
        prep: [
          "YAML pipelines: stages → jobs → steps; templates for reuse",
          "Variable groups, service connections, secret handling",
          "Environments with approval gates",
          "Boards, repos, and artifacts integration",
        ],
        quiz: [
          {
            question: "What is the hierarchy in an Azure DevOps YAML pipeline?",
            options: [
              "Pipeline → Stages → Jobs → Steps",
              "Pipeline → Jobs → Stages → Tasks",
              "Pipeline → Phases → Agents → Commands",
              "Pipeline → Environments → Jobs → Actions",
            ],
            correct: 0,
          },
          {
            question: "What is an Azure DevOps Service Connection?",
            options: [
              "Stored credentials letting pipelines authenticate to external services",
              "A peering link between two Azure DevOps organizations",
              "An agent pool reserved for deployment jobs",
              "A webhook channel between Boards and external trackers",
            ],
            correct: 0,
          },
          {
            question: "How do you gate a production deployment in Azure DevOps?",
            options: [
              "Approvals on the Environment: the pipeline pauses for a reviewer",
              "A manual queue-time variable the releaser must set",
              "Branch policies requiring a signed tag before deploy stages run",
              "A scheduled trigger that only fires in approved windows",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "Azure Portal / GCP",
        oneliner: "Cloud control planes for provisioning compute, storage, networking, and managed services.",
        prep: [
          "Identity: RBAC, service principals, managed identities",
          "Resource groups, subscriptions, cost management",
          "Core services: App Service, Blob Storage, Cloud Run, BigQuery",
        ],
        quiz: [
          {
            question: "What is RBAC in Azure?",
            options: [
              "Role-Based Access Control: permissions granted to identities at specific scopes",
              "Resource Boundary Access Configuration: network rules between resource groups",
              "Role-Bound Audit Compliance: logging of privileged operations",
              "Regional Backup and Availability Control: failover policies",
            ],
            correct: 0,
          },
          {
            question: "What is a Service Principal in Azure?",
            options: [
              "An identity for applications or automation to access resources without a human user",
              "The owner account that created the subscription",
              "A managed certificate used for TLS between Azure services",
              "The default admin role assigned to each resource group",
            ],
            correct: 0,
          },
          {
            question: "What is Google Cloud Run?",
            options: [
              "Fully managed serverless platform running stateless containers on demand",
              "Google's managed Kubernetes control plane",
              "A VM service optimized for containerized batch jobs",
              "A build service that compiles containers from source",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "CI/CD Pipelines",
        oneliner: "Automated workflows that build, test, and deploy code on every change.",
        prep: [
          "Fast feedback: cheap checks first, expensive checks later",
          "Reproducible builds; pinned dependencies",
          "Rollback strategies: blue-green, canary, feature flags",
          "Secrets via vault/variable groups: never in code or logs",
          "Be ready to walk through a pipeline you designed",
        ],
        quiz: [
          {
            question: "What is a key principle of reproducible builds?",
            options: [
              "Same source and inputs always produce identical artifacts, anywhere, anytime",
              "Every build runs on a freshly provisioned machine",
              "Builds are signed so artifacts can be traced to a commit",
              "Dependencies update automatically so builds never go stale",
            ],
            correct: 0,
          },
          {
            question: "How should secrets be handled in a CI/CD pipeline?",
            options: [
              "Injected at runtime from a secrets manager: never in source or logs",
              "Stored in a private .env file committed to a restricted repo",
              "Encrypted in the repository and decrypted by the build agent",
              "Set once on the build machine so pipelines never touch them",
            ],
            correct: 0,
          },
          {
            question: "What makes a fast-feedback CI pipeline?",
            options: [
              "Cheap checks (lint, unit tests) run first; expensive ones (E2E) later",
              "All checks run in parallel regardless of cost",
              "Tests run only on the main branch to keep PRs fast",
              "Flaky tests retry automatically until they pass",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "Docker",
        oneliner: "Container platform: package apps with their dependencies into portable, isolated images.",
        prep: [
          "Image vs container: immutable template vs running instance",
          "Layer caching: order Dockerfile steps from least to most frequently changing",
          "Multi-stage builds keep production images small",
          "Volumes vs bind mounts; networks for container-to-container traffic",
          "docker compose for local multi-service development",
        ],
        quiz: [
          {
            question: "What is the difference between a Docker image and a container?",
            options: [
              "An image is an immutable template; a container is a running instance of it",
              "An image is the running process; a container is its saved snapshot",
              "Images are for registries; containers are the local copies of them",
              "Images hold the OS layer; containers hold the application layer",
            ],
            correct: 0,
          },
          {
            question: "Why use multi-stage builds in a Dockerfile?",
            options: [
              "Build tools stay in earlier stages; only artifacts reach the small final image",
              "Stages build in parallel, cutting total image build time",
              "Each stage produces an image for a different CPU architecture",
              "Stages let several services share one Dockerfile cleanly",
            ],
            correct: 0,
          },
          {
            question: "How does Dockerfile layer caching work?",
            options: [
              "Each instruction is a layer; unchanged layers are reused, so put stable steps first",
              "The daemon caches the final image and rebuilds only on tag changes",
              "Layers are cached per container and cleared on restart",
              "Only FROM and COPY instructions are cached, never RUN",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "Kubernetes",
        oneliner: "Container orchestrator: schedules, scales, and heals containerized workloads across a cluster.",
        prep: [
          "Core objects: Pod → Deployment → Service → Ingress; ConfigMaps and Secrets",
          "Declarative model: describe desired state, controllers reconcile toward it",
          "Liveness vs readiness probes; resource requests vs limits",
          "Rolling updates and rollbacks; Horizontal Pod Autoscaler",
        ],
        quiz: [
          {
            question: "What is the relationship between a Deployment, Pods, and a Service?",
            options: [
              "A Deployment manages replica Pods; a Service gives them one stable network endpoint",
              "A Service creates Pods on demand; the Deployment routes traffic to them",
              "Pods schedule Deployments onto nodes; Services monitor their health",
              "Deployments and Services are two interchangeable ways to run Pods",
            ],
            correct: 0,
          },
          {
            question: "What is the difference between liveness and readiness probes?",
            options: [
              "Liveness failure restarts the container; readiness failure removes it from traffic",
              "Readiness failure restarts the container; liveness failure stops traffic",
              "Liveness runs once at startup; readiness runs for the container's lifetime",
              "Liveness checks the node; readiness checks the Pod",
            ],
            correct: 0,
          },
          {
            question: "What does Kubernetes' declarative model mean?",
            options: [
              "You declare desired state in manifests; controllers continuously reconcile toward it",
              "You issue imperative commands that the API server records and replays",
              "Cluster state is fixed at deploy time; changes require a full redeploy",
              "Nodes agree on state peer-to-peer without a central control plane",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "Git",
        oneliner: "Distributed version control: the backbone of every modern development workflow.",
        prep: [
          "Trunk-based vs Gitflow: and why trunk-based won",
          "Rebase vs merge; interactive rebase for history hygiene",
          "cherry-pick, bisect, reflog as recovery tools",
          "Conflict resolution strategy under pressure",
        ],
        quiz: [
          {
            question: "What is the key advantage of trunk-based development over Gitflow?",
            options: [
              "Small frequent merges to main reduce conflicts and enable continuous integration",
              "Long-lived branches allow more thorough testing before merge",
              "A dedicated release branch isolates production hotfixes",
              "Every feature gets an independent deployment pipeline",
            ],
            correct: 0,
          },
          {
            question: "What does git rebase do versus git merge?",
            options: [
              "Rebase replays commits onto another branch for linear history; merge adds a merge commit",
              "Rebase combines branches without conflicts by preferring your changes",
              "Merge rewrites commit hashes; rebase preserves them",
              "Rebase squashes commits into one; merge keeps them separate",
            ],
            correct: 0,
          },
          {
            question: "What is git bisect used for?",
            options: [
              "Binary-searching history to find the commit that introduced a bug",
              "Splitting a large commit into several smaller ones",
              "Finding the common ancestor of two diverged branches",
              "Listing commits that touched a given file or function",
            ],
            correct: 0,
          },
        ],
      },
    ],
  },
  {
    name: "Monitoring",
    emoji: "📊",
    color: "#F472B6",
    items: [
      {
        tech: "Application Insights",
        oneliner: "Azure's APM service: traces, exceptions, performance metrics, and live telemetry.",
        prep: [
          "Instrumenting Node/React apps; auto-collected vs custom telemetry",
          "Custom events and metrics (trackEvent, trackMetric)",
          "Availability tests and alert rules",
          "Backed by Log Analytics workspaces: query with KQL",
        ],
        quiz: [
          {
            question: "What is a Log Analytics workspace in relation to Application Insights?",
            options: [
              "The underlying telemetry store, enabling cross-resource KQL queries",
              "A visualization layer on top of App Insights dashboards",
              "A retention tier for telemetry older than 90 days",
              "A sandbox for testing queries against sampled data",
            ],
            correct: 0,
          },
          {
            question: "What are Application Insights availability tests?",
            options: [
              "Synthetic probes pinging your app from global locations, alerting on downtime",
              "Health checks the SDK runs inside your app every minute",
              "Load tests that measure capacity at peak traffic",
              "Dependency checks verifying downstream services respond",
            ],
            correct: 0,
          },
          {
            question: "What is a custom event in Application Insights?",
            options: [
              "Telemetry you track explicitly (trackEvent) to measure business-specific actions",
              "An exception enriched with custom properties",
              "An alert definition based on a custom KQL query",
              "A synthetic transaction recorded from the portal",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "KQL",
        oneliner: "Kusto Query Language: used to query Azure Monitor, Log Analytics, and App Insights.",
        prep: [
          "Core operators: where, summarize, extend, project, join",
          "bin() for time bucketing; render timechart",
          "Typical queries: error rates, P95 latency, anomaly spotting",
        ],
        quiz: [
          {
            question: "What does the KQL summarize operator do?",
            options: [
              "Aggregates rows with count()/avg()/sum(), grouped by given columns",
              "Produces a statistical profile of every column in the table",
              "Collapses duplicate rows while keeping the first occurrence",
              "Truncates long string columns for readable output",
            ],
            correct: 0,
          },
          {
            question: "What is the bin() function used for?",
            options: [
              "Rounding values into buckets: typically timestamps for time-series charts",
              "Encoding values into binary for compact storage",
              "Partitioning a query across cluster nodes",
              "Sampling a fixed number of rows per group",
            ],
            correct: 0,
          },
          {
            question: "Which operator adds a calculated column without removing existing ones?",
            options: ["extend", "project", "summarize", "parse"],
            correct: 0,
          },
        ],
      },
      {
        tech: "Datadog",
        oneliner: "Full-stack observability platform: metrics, logs, traces, and dashboards in one.",
        prep: [
          "Infrastructure metrics vs APM spans and traces",
          "Log correlation via trace IDs",
          "Monitors and alert design; dashboards",
        ],
        quiz: [
          {
            question: "What is the difference between an infrastructure metric and an APM span?",
            options: [
              "Metrics measure system resources; spans represent operations within a distributed trace",
              "Spans aggregate metrics over time; metrics are raw point-in-time samples",
              "Metrics come from the agent; spans come from log parsing",
              "Spans are sampled; metrics capture every data point",
            ],
            correct: 0,
          },
          {
            question: "What is log correlation in Datadog APM?",
            options: [
              "Linking logs to their trace via a shared trace ID, so you can pivot from span to logs",
              "Grouping similar log lines into patterns to cut noise",
              "Matching logs across services by timestamp proximity",
              "Enriching logs with host and container metadata",
            ],
            correct: 0,
          },
          {
            question: "What is a Datadog Monitor?",
            options: [
              "An alert rule evaluating a metric or query and notifying when a condition is met",
              "A live dashboard widget streaming a single metric",
              "The host agent process that collects and ships metrics",
              "A synthetic browser test recording user journeys",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "Grafana",
        oneliner: "Open-source dashboarding tool that visualizes metrics from almost any data source.",
        prep: [
          "Data sources: Prometheus (metrics), Loki (logs), SQL databases",
          "Dashboard variables for reusable views",
          "Alerting rules and notification channels",
        ],
        quiz: [
          {
            question: "What is the role of Prometheus in a Grafana stack?",
            options: [
              "Prometheus scrapes and stores time-series metrics; Grafana queries and visualizes them",
              "Prometheus renders the dashboards; Grafana collects the metrics",
              "Prometheus aggregates logs that Grafana turns into metrics",
              "Prometheus pushes alerts that Grafana stores and routes",
            ],
            correct: 0,
          },
          {
            question: "What are Grafana dashboard variables used for?",
            options: [
              "Dynamic dashboards: switch host or environment without editing queries",
              "Storing connection credentials per data source",
              "Passing thresholds from one panel's query into another",
              "Templating alert messages with runtime values",
            ],
            correct: 0,
          },
          {
            question: "What is Loki in the Grafana ecosystem?",
            options: [
              "A log aggregation system indexing only label metadata, for cheap log querying",
              "Grafana's embedded time-series database for metrics",
              "A tracing backend implementing the OpenTelemetry protocol",
              "An agent that tails files and ships them to Grafana Cloud",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "LaunchDarkly",
        oneliner: "Feature flag platform for controlled rollouts, A/B testing, and kill switches.",
        prep: [
          "Targeting: users, segments, percentage rollouts",
          "Progressive delivery and kill switches",
          "Flags enable trunk-based development: merge unfinished work safely",
          "Flag hygiene: clean up stale flags",
        ],
        quiz: [
          {
            question: "How do feature flags enable trunk-based development?",
            options: [
              "Unfinished features merge to main behind a flag, shipping dark until ready",
              "Flags tag commits so incomplete work is excluded from builds",
              "Each flag maps to a branch that auto-merges when toggled on",
              "Flags gate which branches the CI pipeline may deploy",
            ],
            correct: 0,
          },
          {
            question: "What is a percentage rollout in LaunchDarkly?",
            options: [
              "Serving the new variation to a set share of users, expanding as confidence grows",
              "Limiting flag evaluations to a percentage of total traffic",
              "Splitting traffic 50/50 between control and experiment",
              "Gradually increasing request rate to a newly deployed service",
            ],
            correct: 0,
          },
          {
            question: "What is the kill switch use case for a feature flag?",
            options: [
              "Instantly disabling a problematic feature in production without a deploy",
              "Automatically rolling back the latest deployment when errors spike",
              "Pausing all background jobs during an incident",
              "Disabling the SDK so all flags return their defaults",
            ],
            correct: 0,
          },
        ],
      },
    ],
  },
  {
    name: "AI Tooling",
    emoji: "🤖",
    color: "#A78BFA",
    items: [
      {
        tech: "GitHub Copilot",
        oneliner: "AI pair programmer embedded in your editor: autocomplete, chat, and code review.",
        prep: [
          "Prompting: comments and signatures steer suggestions",
          "Trust but verify: review for security issues and subtle bugs",
          "PR review integration on GitHub",
          "IP and licensing considerations for shipped code",
        ],
        quiz: [
          {
            question: "What is the primary security risk when using Copilot?",
            options: [
              "It can suggest insecure patterns: hardcoded secrets or injection-prone queries that need review",
              "It uploads your proprietary code to public training datasets",
              "It can execute suggested code before you accept it",
              "It weakens branch protections by auto-approving its own PRs",
            ],
            correct: 0,
          },
          {
            question: "How does a comment or function signature improve Copilot suggestions?",
            options: [
              "It gives the model context about intent, producing more relevant completions",
              "It pins the suggestion style to match that comment's formatting",
              "It tells Copilot which files to include as additional context",
              "It raises the suggestion confidence threshold for that block",
            ],
            correct: 0,
          },
          {
            question: "What is a key IP consideration with Copilot?",
            options: [
              "Suggestions may resemble open-source code: review license implications before shipping",
              "Copilot output is automatically licensed under Apache 2.0",
              "GitHub retains copyright over accepted suggestions",
              "Generated code cannot be patented in most jurisdictions",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "Claude / OpenAI Codex",
        oneliner: "LLMs accessed via API for code generation, summarization, and reasoning tasks.",
        prep: [
          "Messages API: system prompt, roles, multi-turn structure",
          "Sampling: temperature and top_p",
          "Tool use / function calling loop",
          "Token limits, context windows, cost-latency tradeoffs between model sizes",
        ],
        quiz: [
          {
            question: "What does temperature control in an LLM API call?",
            options: [
              "Output randomness: lower is more deterministic, higher more varied",
              "How long the model reasons before answering",
              "The penalty applied to repeated tokens",
              "The share of the context window reserved for the response",
            ],
            correct: 0,
          },
          {
            question: "What is tool use / function calling in LLM APIs?",
            options: [
              "The model requests defined functions to be run and uses their results to continue",
              "Executing model-generated code in a provider-hosted sandbox",
              "Routing parts of a prompt to specialized fine-tuned models",
              "Letting the model call other LLMs as sub-agents",
            ],
            correct: 0,
          },
          {
            question: "What is the tradeoff between larger and smaller models (e.g. Opus vs Haiku)?",
            options: [
              "Larger: more capable but slower and pricier; smaller: faster and cheaper but less capable",
              "Smaller models are distilled to match larger ones, so quality is equal at lower cost",
              "Larger models are faster because they run on dedicated hardware",
              "They differ only in context window size, not capability",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "RAG Pipelines",
        oneliner: "Retrieval-Augmented Generation: ground LLM responses in your own data via vector search.",
        prep: [
          "Pipeline: chunk → embed → store → retrieve → assemble prompt",
          "Chunking tradeoffs: size vs context vs precision",
          "Vector stores: Pinecone, pgvector",
          "Hybrid search: semantic + keyword (BM25); reranking",
        ],
        quiz: [
          {
            question: "Why is chunking strategy important in a RAG pipeline?",
            options: [
              "Too-large chunks lose precision; too-small lose context: size drives retrieval quality",
              "Chunk count determines how many documents the store can hold",
              "Smaller chunks embed faster, so chunking is mainly a cost lever",
              "Chunk boundaries must align with the LLM's tokenizer blocks",
            ],
            correct: 0,
          },
          {
            question: "What is an embedding in the context of RAG?",
            options: [
              "A dense vector capturing text's semantic meaning, enabling similarity search",
              "A compressed copy of the document stored alongside its metadata",
              "The retrieved context inserted into the prompt template",
              "A lightweight fine-tune adapting the model to your corpus",
            ],
            correct: 0,
          },
          {
            question: "When is keyword search (BM25) preferable to vector search in RAG?",
            options: [
              "Exact terms, IDs, or technical strings where semantic similarity returns wrong matches",
              "When the corpus is too large to embed economically",
              "When queries and documents are in different languages",
              "When the embedding model wasn't trained on the corpus domain",
            ],
            correct: 0,
          },
        ],
      },
    ],
  },
  {
    name: "Testing",
    emoji: "🧪",
    color: "#A3E635",
    items: [
      {
        tech: "Playwright (E2E)",
        oneliner: "Modern browser automation framework for reliable end-to-end testing across all browsers.",
        prep: [
          "Auto-waiting for actionability: no manual sleeps",
          "Locators: getByRole / getByText over CSS selectors and test IDs",
          "Network mocking and fixtures; Page Object Model",
          "CI: parallel workers, traces and videos on failure",
        ],
        quiz: [
          {
            question: "What makes Playwright's auto-waiting valuable?",
            options: [
              "It waits for elements to be actionable before interacting, killing flaky sleep() calls",
              "It retries whole failed tests with increasing timeouts",
              "It blocks until all network activity stops before each step",
              "It syncs test steps with the app's animation frames",
            ],
            correct: 0,
          },
          {
            question: "Why is getByRole the preferred locator strategy?",
            options: [
              "It targets ARIA roles: how assistive tech sees the page, so tests survive style changes",
              "It is fastest because it maps directly to native browser queries",
              "It guarantees uniqueness, unlike text-based locators",
              "It works identically across all three browser engines",
            ],
            correct: 0,
          },
          {
            question: "What is the Page Object Model?",
            options: [
              "Encapsulating page UI and interactions in classes, separating tests from selector details",
              "Snapshotting the DOM as an object tree for fast assertions",
              "Mapping each route to a fixture that seeds its test data",
              "Modeling user journeys as state machines for test generation",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "Jest",
        oneliner: "All-in-one JavaScript test runner with built-in mocking, assertions, and coverage.",
        prep: [
          "describe / it / beforeEach structure",
          "jest.fn(), spies, module mocks (jest.mock)",
          "Snapshot testing: legitimate uses and common abuse",
          "TypeScript and ESM configuration gotchas",
        ],
        quiz: [
          {
            question: "What is the risk of overusing snapshot tests?",
            options: [
              "Snapshots get updated mindlessly without reviewing diffs, creating false confidence",
              "Large snapshots slow the test suite significantly",
              "Snapshots break determinism when tests run in parallel",
              "Snapshot files drift from source and cause merge conflicts",
            ],
            correct: 0,
          },
          {
            question: "What does jest.fn() create?",
            options: [
              "A mock function recording calls and arguments, for assertions on usage",
              "A spy wrapping an existing function without replacing its behavior",
              "A stub that throws unless given an explicit implementation",
              "A factory producing fresh fixtures for each test",
            ],
            correct: 0,
          },
          {
            question: "How do you mock an entire module in Jest?",
            options: [
              "jest.mock('./module') at the top of the test file auto-mocks its exports",
              "jest.replaceModule() inside beforeEach",
              "Adding the module to __mocks__ in jest.config",
              "Importing it through jest.requireMock at call sites",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "React Testing Library",
        oneliner: "Test React components the way users interact: via accessible queries, not implementation details.",
        prep: [
          "Query priority: getByRole > getByText > getByTestId",
          "userEvent over fireEvent for realistic interaction",
          "Async utilities: findBy, waitFor",
          "Test behavior, not implementation",
        ],
        quiz: [
          {
            question: "Why does RTL discourage querying by implementation details like state?",
            options: [
              "Tests tied to internals break on refactors even when behavior is unchanged",
              "Reading internal state forces extra renders that skew results",
              "Internal queries don't work in concurrent rendering mode",
              "Implementation details differ between dev and production builds",
            ],
            correct: 0,
          },
          {
            question: "What is the difference between userEvent and fireEvent?",
            options: [
              "userEvent simulates full interactions (focus, keydown…); fireEvent dispatches one synthetic event",
              "fireEvent is async and awaits React updates; userEvent is synchronous",
              "userEvent works only with form elements; fireEvent works everywhere",
              "fireEvent runs in the browser; userEvent runs in jsdom only",
            ],
            correct: 0,
          },
          {
            question: "When should you use findBy queries instead of getBy?",
            options: [
              "For elements appearing asynchronously: findBy returns a promise and retries",
              "When several matches exist and you want the first",
              "When asserting an element is absent from the DOM",
              "When the element is rendered inside a portal",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "TDD",
        oneliner: "Write the failing test first, then write only enough code to make it pass.",
        prep: [
          "Red-Green-Refactor cycle",
          "Tests-first shapes API design from the caller's view",
          "Best value: pure functions, complex logic",
          "Friction zones: exploratory UI, integration-heavy code",
        ],
        quiz: [
          {
            question: "What are the three steps of the TDD cycle?",
            options: [
              "Failing test (Red) → minimal code to pass (Green) → clean up (Refactor)",
              "Design (Red) → implement (Green) → test (Refactor)",
              "Write code (Red) → write matching tests (Green) → optimize (Refactor)",
              "Run suite (Red) → fix failures (Green) → add features (Refactor)",
            ],
            correct: 0,
          },
          {
            question: "How does TDD influence API design?",
            options: [
              "Writing tests first forces designing from the caller's perspective, yielding cleaner interfaces",
              "It pushes APIs toward fewer, larger functions that are easier to cover",
              "It front-loads edge-case handling into the public surface",
              "It favors abstract interfaces so mocks are easy to inject",
            ],
            correct: 0,
          },
          {
            question: "Where does TDD create friction rather than value?",
            options: [
              "Exploratory UI work and code where the right design isn't yet known",
              "Pure functions with clear inputs and outputs",
              "Business logic with complex branching",
              "Bug fixes that can be reproduced in a test",
            ],
            correct: 0,
          },
        ],
      },
    ],
  },
  {
    name: "Engineering",
    emoji: "🛠️",
    color: "#E879F9",
    items: [
      {
        tech: "Engineering Principles",
        oneliner: "The design judgment behind good code: SOLID, coupling, simplicity and trade-offs.",
        prep: [
          "SOLID, and when each principle helps more than it costs",
          "Coupling vs cohesion: depend on abstractions, keep related things together",
          "KISS, YAGNI and DRY, including when duplication is the cheaper option",
          "Composition over inheritance; common design patterns and their misuse",
          "Refactoring safely: tests first, small steps, clear names",
        ],
        quiz: [
          {
            question: "What does the Single Responsibility Principle ask of a module?",
            options: [
              "It should have one reason to change",
              "It should contain exactly one function",
              "It should be used by only one caller",
              "It should never depend on another module",
            ],
            correct: 0,
          },
          {
            question: "What does YAGNI warn against?",
            options: [
              "Building features or flexibility before there is a real need for them",
              "Writing tests before the implementation",
              "Refactoring code that already works",
              "Using third-party libraries instead of writing your own",
            ],
            correct: 0,
          },
          {
            question: "Why is composition often preferred over inheritance?",
            options: [
              "It combines small behaviors without locking classes into a rigid hierarchy",
              "It always runs faster at runtime",
              "It removes the need for interfaces",
              "It lets a class inherit from several parents at once",
            ],
            correct: 0,
          },
        ],
      },
    ],
  },
  {
    name: "Mobile Delivery",
    emoji: "📱",
    color: "#FB923C",
    items: [
      {
        tech: "App Store / Play Store",
        oneliner: "Apple and Google's distribution pipelines: submission, review, versioning, and rollout.",
        prep: [
          "iOS: certificates, provisioning profiles, TestFlight",
          "Android: keystore, build variants, app bundles",
          "Staged rollouts and post-release monitoring",
          "OTA updates (Expo/CodePush): JS only, never native changes",
          "Handling review rejections",
        ],
        quiz: [
          {
            question: "What is the purpose of an iOS provisioning profile?",
            options: [
              "It ties App ID, signing certificate, and allowed devices together, authorizing the app to run",
              "It declares the app's entitlements shown on the App Store listing",
              "It encrypts the binary for transmission to App Store Connect",
              "It registers the app's push notification certificates",
            ],
            correct: 0,
          },
          {
            question: "What is an OTA update and its key limitation?",
            options: [
              "Pushing JS bundle changes without a store release: works for JS/assets, not native code",
              "Silent store updates that skip the user's approval: limited to minor versions",
              "Streaming new features behind flags: limited to UI changes",
              "Differential binary patches: limited by maximum download size",
            ],
            correct: 0,
          },
          {
            question: "What is a staged rollout on the Play Store?",
            options: [
              "Releasing to a percentage of users first, expanding after monitoring stability",
              "Promoting a build through internal, closed, and open testing tracks",
              "Shipping different binaries per region in sequence",
              "Releasing the update only to users on the latest OS version first",
            ],
            correct: 0,
          },
        ],
      },
    ],
  },
  {
    name: "Databases & CRM",
    emoji: "🗄️",
    color: "#94A3B8",
    items: [
      {
        tech: "PostgreSQL",
        oneliner: "Powerful open-source relational database with strong ACID compliance and rich feature set.",
        prep: [
          "Indexes: B-tree default; GIN for JSONB/full-text; partial indexes",
          "EXPLAIN ANALYZE for real execution plans",
          "JSONB, CTEs, window functions",
          "Connection pooling with PgBouncer; row-level security",
        ],
        quiz: [
          {
            question: "When would you use a GIN index instead of a B-tree?",
            options: [
              "Full-text search, JSONB containment, and arrays: values with multiple components per row",
              "High-write tables where B-tree maintenance is too costly",
              "Range scans over timestamp columns",
              "Covering indexes that satisfy queries without heap access",
            ],
            correct: 0,
          },
          {
            question: "What does EXPLAIN ANALYZE show?",
            options: [
              "The actual execution plan with real row counts and timing, not just estimates",
              "Estimated costs plus the indexes the planner considered and rejected",
              "Lock contention and I/O waits encountered during the query",
              "A recommendation of indexes that would speed up the query",
            ],
            correct: 0,
          },
          {
            question: "What is Row-Level Security in PostgreSQL?",
            options: [
              "Policies restricting which rows a role can read or modify",
              "Per-row encryption keys derived from the connecting role",
              "Audit triggers recording every change to protected rows",
              "Locks that serialize concurrent updates to the same row",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "MySQL",
        oneliner: "The most widely deployed open-source relational database: fast reads, huge ecosystem.",
        prep: [
          "InnoDB vs MyISAM: transactions and row-level locking",
          "Indexing and query optimization (EXPLAIN)",
          "Replication for read scaling and failover",
          "Key differences from PostgreSQL",
        ],
        quiz: [
          {
            question: "What is the key difference between InnoDB and MyISAM?",
            options: [
              "InnoDB supports ACID transactions, row locking, and foreign keys; MyISAM doesn't",
              "MyISAM supports transactions but lacks full-text search; InnoDB is the reverse",
              "InnoDB is read-optimized; MyISAM is the default for write-heavy loads",
              "MyISAM stores data in memory; InnoDB persists to disk",
            ],
            correct: 0,
          },
          {
            question: "What is MySQL replication primarily used for?",
            options: [
              "Read replicas for scaling reads, plus a failover target",
              "Splitting writes across shards by primary key range",
              "Synchronous multi-master writes across regions",
              "Streaming changes into the binary log for auditing",
            ],
            correct: 0,
          },
          {
            question: "What is a key MySQL vs PostgreSQL difference regarding JSON?",
            options: [
              "PostgreSQL's JSONB is binary-indexed with rich operators; MySQL's JSON support is more limited",
              "MySQL validates JSON schema on write; PostgreSQL stores it raw",
              "PostgreSQL stores JSON as text only; MySQL has the binary format",
              "MySQL allows indexing inside JSON; PostgreSQL requires extracting to columns",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "Oracle",
        oneliner: "Enterprise-grade RDBMS known for performance, features, and large corporate deployments.",
        prep: [
          "PL/SQL: procedures, packages, triggers",
          "Partitioning for very large tables",
          "Explain plans and optimizer hints",
          "Migration patterns to/from PostgreSQL",
        ],
        quiz: [
          {
            question: "What is PL/SQL?",
            options: [
              "Oracle's procedural extension to SQL: stored procedures, functions, triggers, packages",
              "Oracle's parallel query language for data warehousing",
              "A portability layer translating ANSI SQL to Oracle dialect",
              "The scripting language of Oracle's administration tools",
            ],
            correct: 0,
          },
          {
            question: "What is table partitioning used for?",
            options: [
              "Splitting a large table into physical segments for performance and manageability",
              "Distributing a table's rows across RAC cluster nodes",
              "Isolating tenants into separate physical schemas",
              "Versioning table data for point-in-time recovery",
            ],
            correct: 0,
          },
          {
            question: "What is a common challenge migrating from Oracle to PostgreSQL?",
            options: [
              "Rewriting Oracle-specific PL/SQL, sequences, and implicit type coercions",
              "PostgreSQL's lower limits on table size and row width",
              "Recreating Oracle's optimizer hints, which PostgreSQL requires",
              "Converting Oracle's MVCC model to PostgreSQL's locking model",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "MongoDB",
        oneliner: "Document-oriented NoSQL database: flexible schema, horizontal scaling, JSON-native.",
        prep: [
          "Embed vs reference: access patterns decide",
          "Aggregation pipeline stages",
          "Indexes, including compound and text",
          "Atlas Search (Lucene-based)",
        ],
        quiz: [
          {
            question: "When should you embed vs reference documents?",
            options: [
              "Embed for data read together in 1-to-few relations; reference for shared or independently updated data",
              "Embed only primitives; reference any nested object",
              "Embed for write-heavy data; reference for read-heavy data",
              "Always reference: embedding is legacy practice from before $lookup",
            ],
            correct: 0,
          },
          {
            question: "What is the MongoDB aggregation pipeline?",
            options: [
              "A series of stages (match, group, sort…) processing documents to transform or analyze data",
              "A change-stream processor for reacting to writes in real time",
              "The query planner's internal representation of a find()",
              "A bulk-write API batching operations into one round trip",
            ],
            correct: 0,
          },
          {
            question: "What is Atlas Search?",
            options: [
              "Managed full-text search built on Lucene, integrated into Atlas queries",
              "A vector database add-on for semantic search in Atlas",
              "Atlas's UI for querying collections without the shell",
              "An index advisor that recommends indexes from query logs",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "Couchbase",
        oneliner: "Distributed NoSQL database combining key-value speed with SQL-like querying (N1QL).",
        prep: [
          "Bucket → scope → collection model",
          "N1QL: SQL over JSON documents",
          "Indexing (GSI)",
          "Couchbase Lite + Sync Gateway for offline-first mobile",
        ],
        quiz: [
          {
            question: "What is N1QL in Couchbase?",
            options: [
              "A SQL-like language for querying JSON documents: SELECT/JOIN/WHERE on fields",
              "The binary protocol used for key-value reads and writes",
              "A migration dialect for porting SQL schemas into Couchbase",
              "The replication language configuring cross-datacenter sync",
            ],
            correct: 0,
          },
          {
            question: "What is Couchbase Lite used for?",
            options: [
              "An embedded mobile/edge database that syncs with the server for offline-first apps",
              "A single-node Couchbase for local development",
              "A reduced-footprint cache tier in front of the cluster",
              "A serverless query endpoint for occasional workloads",
            ],
            correct: 0,
          },
          {
            question: "What is the bucket/scope/collection hierarchy?",
            options: [
              "Bucket (namespace) → scope (grouping) → collection (table-equivalent holding documents)",
              "Scope (namespace) → bucket (grouping) → collection (documents)",
              "Collection (namespace) → bucket (grouping) → scope (documents)",
              "Bucket and scope are aliases; collections partition them physically",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "Redis",
        oneliner: "In-memory data store: the default answer for caching, sessions, queues, and rate limiting.",
        prep: [
          "Data structures: strings, hashes, lists, sets, sorted sets; per-key TTL",
          "Cache-aside pattern: check cache, fall back to DB, write back with TTL",
          "Invalidation strategies and stampede protection",
          "Persistence: RDB snapshots vs AOF; single-threaded event loop",
          "Beyond caching: pub/sub, distributed locks, rate limiting",
        ],
        quiz: [
          {
            question: "What is the cache-aside pattern?",
            options: [
              "App checks the cache first; on a miss it reads the DB and writes the result back to cache",
              "All writes go to the cache, which flushes to the DB asynchronously",
              "The DB pushes hot rows into the cache based on query frequency",
              "Cache and DB are written together in one transaction on every update",
            ],
            correct: 0,
          },
          {
            question: "Why is Redis fast despite being mostly single-threaded?",
            options: [
              "All data lives in memory and one event loop avoids lock contention",
              "It shards every key across all CPU cores automatically",
              "It compiles commands to native code on first use",
              "It batches all writes into one disk flush per second",
            ],
            correct: 0,
          },
          {
            question: "What is a cache stampede and one way to prevent it?",
            options: [
              "Many requests hammer the DB when a hot key expires; use locking or staggered TTLs",
              "The cache evicts faster than it fills; fix by increasing memory",
              "Two cache nodes serve conflicting values; fix with quorum reads",
              "Clients retry misses in a loop; fix with exponential backoff",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "SQLite",
        oneliner: "Embedded, serverless SQL database: the default choice for local and mobile storage.",
        prep: [
          "Right tool when: single writer, local/embedded/mobile data",
          "WAL mode: concurrent reads while writing",
          "expo-sqlite / React Native usage",
          "Limits: write concurrency, no network server",
        ],
        quiz: [
          {
            question: "What does SQLite's WAL mode enable?",
            options: [
              "Concurrent reads while a write is in progress, improving throughput",
              "Concurrent writes from multiple processes via log merging",
              "Crash recovery without any journaling overhead",
              "Streaming replication to a standby database file",
            ],
            correct: 0,
          },
          {
            question: "What limitation makes SQLite unsuitable for high-concurrency servers?",
            options: [
              "One writer at a time: concurrent writes serialize and bottleneck multi-user apps",
              "No support for joins across attached databases",
              "A hard limit on database file size of a few gigabytes",
              "Readers block while any transaction is open",
            ],
            correct: 0,
          },
          {
            question: "How does Expo use SQLite in React Native apps?",
            options: [
              "expo-sqlite exposes a JS API over a native on-device SQLite database",
              "An in-memory SQLite instance recreated on each app launch",
              "A WebAssembly build of SQLite running in the JS thread",
              "SQLite mirrors AsyncStorage for backward compatibility",
            ],
            correct: 0,
          },
        ],
      },
      {
        tech: "HubSpot",
        oneliner: "CRM and marketing platform with an API for contacts, deals, workflows, and custom objects.",
        prep: [
          "Object model: contacts, companies, deals, custom objects",
          "Associations link objects: the CRM's foreign keys",
          "Webhooks for CRM events; workflow automation",
          "API rate limits and batch endpoints",
        ],
        quiz: [
          {
            question: "What are HubSpot custom objects used for?",
            options: [
              "Modeling business entities beyond contacts/companies/deals, with properties and associations",
              "Extending standard objects with computed properties",
              "Storing raw JSON payloads alongside CRM records",
              "Defining reusable modules for CMS pages",
            ],
            correct: 0,
          },
          {
            question: "What is a HubSpot webhook?",
            options: [
              "A notification to your server when a CRM event occurs, like a property change",
              "An inbound endpoint HubSpot exposes for pushing data into the CRM",
              "A scheduled export of changed records to an external URL",
              "A workflow step that calls custom code inside HubSpot",
            ],
            correct: 0,
          },
          {
            question: "What are HubSpot associations?",
            options: [
              "Relationships between CRM objects: like foreign keys linking a contact to a company and deal",
              "Mappings between HubSpot properties and external system fields",
              "Attribution links connecting marketing touches to closed deals",
              "Groupings of contacts into static and active lists",
            ],
            correct: 0,
          },
        ],
      },
    ],
  },
];
