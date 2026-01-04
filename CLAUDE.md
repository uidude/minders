### Change management

For every change, use a new graphite branch branched of the latest in the workspace. We can later merge/organize them into more coherent PRs.

### Starting the Development Server

Before testing UI changes, start the dev server:

```bash
# If using Node.js v22+, set the legacy OpenSSL provider
export NODE_OPTIONS=--openssl-legacy-provider

# Start the web dev server
yarn web
```

The app will be available at `http://localhost:19006`

### Automated UI Testing with Playwright MCP

**ALWAYS use Playwright MCP to verify UI changes before committing.** This ensures changes work correctly and provides visual documentation.

#### Usage

1. **Navigate to the app:**
   ```
   browser_navigate: http://localhost:19006
   ```

2. **Take a snapshot to see current state:**
   ```
   browser_snapshot
   ```
   This returns an accessibility tree showing all interactive elements with refs like `[ref=e25]`.

3. **Interact with elements:**
   - Click: `browser_click` with element description and ref
   - Type: `browser_type` with element, ref, and text
   - Fill forms: `browser_fill_form` for multiple fields

4. **Take screenshots for documentation:**
   ```
   browser_take_screenshot: filename=feature-name.png
   ```
   Screenshots are saved to `.playwright-mcp/` directory.

#### Example Workflow

```
1. browser_navigate: http://localhost:19006
2. browser_snapshot  # See the login screen
3. browser_take_screenshot: filename=login-screen.png
4. browser_click: element="Sign in with Google", ref="e25"
```

### Project Architecture

- **client/** - Main React Native/Web app (screens, components)
- **common/** - Shared code (MinderApi.tsx for data models, AppLogic.tsx for business logic)
- **admin/** - Admin dashboard
- **server/** - Firebase Cloud Functions
- **project/** - Expo configuration and native code

### Key Files

- `common/MinderApi.tsx` - Minder and MinderProject data models
- `client/App.tsx` - App entry point
- `client/screens/Minders.tsx` - Main minders list screen
- `common/Config.tsx` - Firebase and OAuth configuration
