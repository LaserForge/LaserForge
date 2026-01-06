---
description: Implement a New Feature
---

# New Feature Implementation Workflow

Follow this process when adding a new major feature (e.g., "Rotary Tool", "Image Trace").

1. **Plan & Design**

   - Update `implementation_plan.md` with:
     - [NEW] Components needed.
     - State changes (Zustand).
     - Hardware commands required.
   - _Checkpoint_: Get user approval on the plan update.

2. **Core Logic Implementation**

   - Implement the logic in `src/lib/` (e.g., `RotaryCalculator.ts`).
   - Write a unit test for the logic if complex.

3. **UI Implementation**

   - Create the component in `src/components/` (e.g., `RotarySettings.tsx`).
   - Use strict typing for props.
   - Connect to the store.

4. **Integration**

   - Add the component to `AppLayout` or the relevant Panel.
   - Register any new Routes in `AppPage.tsx`.

5. **Verification**
   - **Offline Check**: Does it crash without internet?
   - **Hardware Check**: Use the Mock Driver to see if correct G-code is generated.
