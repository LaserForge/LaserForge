---
description: Deploy LaserForge to GitHub Pages
---

# Deploy Workflow

This workflow describes how to deploy the Landing Page and Application to GitHub Pages.

1. **Lint and Test**
   Ensure the codebase is clean before building.

   ```bash
   npm run lint
   npm run test
   ```

2. **Build the Application**
   This generates the static files in the `dist` directory.

   ```bash
   npm run build
   ```

   _Verify that the `dist` folder contains `index.html` and `assets`._

3. **Deploy to GitHub Pages (Manual)**
   If not using the GitHub Action, you can deploy manually using the `gh-pages` package.

   ```bash
   # Ensure you have the package
   npm install -D gh-pages

   # Run the deploy script (ensure this is in package.json)
   npm run deploy
   ```

4. **Verify Deployment**
   - Visit `https://LaserForge.io` (Landing Page).
   - Visit `https://LaserForge.io/app` (Application).
   - Check the console for any 404s or chunk loading errors.
