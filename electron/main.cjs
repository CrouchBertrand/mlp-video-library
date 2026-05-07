const { app, BrowserWindow, dialog, shell } = require("electron");
const { fork } = require("child_process");
const fs = require("fs");
const path = require("path");
const http = require("http");
const net = require("net");

let PORT = process.env.MLP_PORT || "";
let serverProcess = null;
let mainWindow = null;

function resourcePath(...parts) {
  if (app.isPackaged) return path.join(process.resourcesPath, ...parts);
  return path.join(__dirname, "..", ...parts);
}

function loadLocalEnv() {
  const candidates = [
    app.isPackaged ? path.join(process.resourcesPath, "mlp.env") : resourcePath(".env"),
    path.join(path.dirname(app.getPath("exe")), "mlp.env")
  ];
  const values = {};

  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const index = trimmed.indexOf("=");
      const key = trimmed.slice(0, index).trim();
      const rawValue = trimmed.slice(index + 1).trim();
      values[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  }

  return values;
}

function ensureUserDataFiles() {
  const userData = app.getPath("userData");
  const dbPath = path.join(userData, "mlp-video-library-v5.db");
  const uploadDir = path.join(userData, "uploads");
  fs.mkdirSync(uploadDir, { recursive: true });

  if (!fs.existsSync(dbPath)) {
    const seedDb = resourcePath("dev.db");
    if (fs.existsSync(seedDb)) fs.copyFileSync(seedDb, dbPath);
  }

  return { dbPath, uploadDir };
}

function waitForServer(url, timeoutMs = 30000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - started > timeoutMs) {
          reject(new Error("The local MLP server did not start in time."));
        } else {
          setTimeout(check, 500);
        }
      });
      req.setTimeout(1500, () => {
        req.destroy();
      });
    };
    check();
  });
}

function choosePort() {
  if (PORT) return Promise.resolve(PORT);
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? String(address.port) : "3765";
      server.close(() => resolve(port));
    });
  });
}

async function startServer() {
  PORT = await choosePort();
  const serverDir = app.isPackaged ? resourcePath("app-server") : resourcePath(".next", "standalone");
  const serverFile = path.join(serverDir, "server.js");
  const { dbPath, uploadDir } = ensureUserDataFiles();
  const localEnv = loadLocalEnv();

  if (!fs.existsSync(serverFile)) {
    throw new Error(`Could not find compiled server at ${serverFile}. Run npm.cmd run dist:win first.`);
  }

  serverProcess = fork(serverFile, {
    cwd: serverDir,
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT,
      HOSTNAME: "127.0.0.1",
      DATABASE_URL: `file:${dbPath.replace(/\\/g, "/")}`,
      SESSION_SECRET: process.env.SESSION_SECRET || "desktop-local-session-secret-change-before-public-deployment",
      COOKIE_SECURE: "false",
      YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || localEnv.YOUTUBE_API_KEY || "",
      MLP_UPLOAD_DIR: uploadDir,
      ELECTRON_RUN_AS_NODE: "1"
    },
    stdio: "ignore",
    windowsHide: true
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    title: "MLP Video Library",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  const url = `http://127.0.0.1:${PORT}`;
  await waitForServer(url);
  await mainWindow.loadURL(url);
}

app.whenReady().then(async () => {
  try {
    await startServer();
    await createWindow();
  } catch (error) {
    dialog.showErrorBox("MLP Video Library could not start", error instanceof Error ? error.message : String(error));
    app.quit();
  }
});

app.on("window-all-closed", () => {
  app.quit();
});

app.on("before-quit", () => {
  if (serverProcess) serverProcess.kill();
});
