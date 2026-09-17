// MAINTENANCE WARNING: the mocks below reach into React Native private
// internals (react-native/Libraries/* paths) because jest-expo's preset
// alone does not boot RN 0.85 components under the node test environment
// (verified: removing them fails all suites). If tests break mysteriously
// after an Expo SDK / RN upgrade, start here.
global.__DEV__ = true;
global.IS_REACT_ACT_ENVIRONMENT = true;
global.IS_REACT_NATIVE_TEST_ENVIRONMENT = true;
global.__fbBatchedBridgeConfig = { remoteModuleConfig: [], localModulesConfig: [] };
global.requestAnimationFrame = global.requestAnimationFrame || ((callback) => setTimeout(callback, 0));
global.cancelAnimationFrame = global.cancelAnimationFrame || ((id) => clearTimeout(id));

const mockNativeAnimatedModule = {
  startOperationBatch: jest.fn(),
  finishOperationBatch: jest.fn(),
  createAnimatedNode: jest.fn(),
  updateAnimatedNodeConfig: jest.fn(),
  getValue: jest.fn(),
  startListeningToAnimatedNodeValue: jest.fn(),
  stopListeningToAnimatedNodeValue: jest.fn(),
  connectAnimatedNodes: jest.fn(),
  disconnectAnimatedNodes: jest.fn(),
  startAnimatingNode: jest.fn((animationId, nodeTag, config, endCallback) => endCallback && endCallback({ finished: true })),
  stopAnimation: jest.fn(),
  setAnimatedNodeValue: jest.fn(),
  setAnimatedNodeOffset: jest.fn(),
  flattenAnimatedNodeOffset: jest.fn(),
  extractAnimatedNodeOffset: jest.fn(),
  connectAnimatedNodeToView: jest.fn(),
  connectAnimatedNodeToShadowNodeFamily: jest.fn(),
  disconnectAnimatedNodeFromView: jest.fn(),
  restoreDefaultValues: jest.fn(),
  dropAnimatedNode: jest.fn(),
  addAnimatedEventToView: jest.fn(),
  removeAnimatedEventFromView: jest.fn(),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
  queueAndExecuteBatchedOperations: jest.fn(),
};



jest.mock("react-native/Libraries/EventEmitter/NativeEventEmitter", () => {
  return class NativeEventEmitter {
    addListener() { return { remove: jest.fn() }; }
    removeListener() {}
    removeAllListeners() {}
    removeSubscription() {}
  };
});

jest.mock("react-native/Libraries/TurboModule/TurboModuleRegistry", () => {
  const modules = {
    PlatformConstants: {
      getConstants: () => ({
        forceTouchAvailable: false,
        interfaceIdiom: "phone",
        isTesting: true,
        osVersion: "17.0",
        reactNativeVersion: { major: 0, minor: 85, patch: 3 },
      }),
    },
    DeviceInfo: {
      getConstants: () => ({
        Dimensions: {
          window: { width: 390, height: 844, scale: 3, fontScale: 1 },
          screen: { width: 390, height: 844, scale: 3, fontScale: 1 },
        },
      }),
    },
    NativeAnimatedModule: mockNativeAnimatedModule,
  };
  return {
    get: (name) => modules[name] || null,
    getEnforcing: (name) => modules[name] || { getConstants: () => ({}) },
  };
});

require("react-native-gesture-handler/jestSetup");

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("react-native-reanimated", () => {
  const { View } = require("react-native");
  const chain = { delay: () => chain, springify: () => chain, damping: () => chain };
  return {
    __esModule: true,
    default: { View },
    FadeInDown: chain,
    FadeIn: chain,
    FadeInRight: chain,
    ZoomIn: chain,
    ZoomOut: chain,
    interpolate: (value, input, output) => {
      if (value <= input[0]) return output[0];
      if (value >= input[input.length - 1]) return output[output.length - 1];
      const range = input[1] - input[0];
      const progress = range === 0 ? 0 : (value - input[0]) / range;
      return output[0] + progress * (output[1] - output[0]);
    },
    useAnimatedStyle: (worklet) => worklet(),
    useSharedValue: (value) => ({ value }),
    useDerivedValue: (worklet) => ({ value: worklet() }),
    withSpring: (value) => value,
    withTiming: (value) => value,
    withSequence: (...values) => values[values.length - 1],
    Easing: { linear: (value) => value, out: (fn) => fn, cubic: (value) => value },
  };
});

// Native OAuth + live Supabase session: screens only need a signed-in, non-demo user.
jest.mock("@/lib/oauth", () => ({ signInWithGitHub: jest.fn(), linkGitHubIdentity: jest.fn() }));
jest.mock("@/lib/useIsDemo", () => ({ useIsDemo: () => false }));

jest.mock("expo-haptics", () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  return {
    SafeAreaProvider: ({ children }) => React.createElement(React.Fragment, null, children),
    SafeAreaView: ({ children }) => React.createElement(React.Fragment, null, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock("@shopify/react-native-skia", () => {
  const React = require("react");
  const { View } = require("react-native");
  const NullShape = () => null;
  return {
    Canvas: ({ children, style }) => React.createElement(View, { testID: "skia-canvas", style }, children),
    Circle: NullShape,
    Path: NullShape,
  };
});

const originalConsoleError = console.error;
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation((message, ...args) => {
    const text = [message, ...args].map(String).join(" ");
    if (
      text.includes("The current testing environment is not configured to support act") ||
      (text.includes("An update to") && text.includes("inside a test was not wrapped in act")) ||
      text.includes("VirtualizedList inside a test was not wrapped in act")
    ) {
      return;
    }
    originalConsoleError(message, ...args);
  });
});

afterAll(() => {
  console.error.mockRestore?.();
});
