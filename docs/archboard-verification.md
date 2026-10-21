# Arch Board verification

## Automated checks

- History, placement geometry, and connection transitions: Node built-in test runner.
- Shared evaluator and API mapping: Jest with Watchman disabled.
- Web integration: TypeScript, ESLint, and Vite production build.

## Browser checks

1. Open Arch Board at widths 360, 768, 1024, and 1440 pixels.
2. Add at least 30 nodes. Confirm each appears in a free cell and the canvas scrolls to reach all nodes.
3. Connect node body to body, handle to handle, and Shift-drag handle to target. Confirm Escape and clicking the active source cancel.
4. Focus a node. Move it with arrow keys and Shift+arrow, connect it with Enter, then delete and undo it.
5. Clear and undo. Change scenario with dirty content, first cancel and then confirm. Navigate away and repeat.
6. Save, edit while saving, and confirm the later edit remains marked unsaved. Simulate a failed save and confirm the draft remains.
7. Open Saved Boards. Confirm only summaries load, loading/error states are visible, and one board payload loads after choosing Load.
8. Share, copy, deny clipboard access, and unshare. Confirm each pending/error state appears on the affected board.
9. Evaluate a complete design that triggers a design warning. Confirm 100% is labeled checklist coverage and the warning remains visible.
10. Repeat the primary editing flow at 200% zoom and using only a keyboard.

## Current environment limits

The local build can be exercised through Vite, but no controllable browser surface was available during implementation. Live Supabase ownership, sharing, network payload sizes, pointer/touch behavior, screenshots, screen-reader output, and React Profiler measurements remain manual checks.
