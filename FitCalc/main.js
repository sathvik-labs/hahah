const { app, BrowserWindow, protocol } = require("electron");
const path = require("path");
const fs = require("fs");

protocol.registerSchemesAsPrivileged([
    {
        scheme: "fitcalc",
        privileges: {
            standard: true,
            secure: true,
            supportFetchAPI: true,
            corsEnabled: true
        }
    }
]);

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        title: "FitCalc",
        webPreferences: {
            contextIsolation: true
        }
    });

    // keep the window on the app; open anything external in the browser
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (/^https?:/.test(url)) { require("electron").shell.openExternal(url); }
        return { action: "deny" };
    });
    win.webContents.on("will-navigate", (event, url) => {
        if (!url.startsWith("fitcalc://")) {
            event.preventDefault();
            if (/^https?:/.test(url)) { require("electron").shell.openExternal(url); }
        }
    });

    win.loadURL("fitcalc://app/");
}

app.whenReady().then(() => {

    protocol.handle("fitcalc", async (request) => {
        let url = new URL(request.url);
        let requestedPath;
        try { requestedPath = decodeURIComponent(url.pathname); }
        catch (e) { return new Response("Bad request", { status: 400 }); }

        if (requestedPath === "/") {
            requestedPath = "/index.html";
        }

        // If the URL points to a folder, load its index.html
        if (requestedPath.endsWith("/")) {
            requestedPath += "index.html";
        }

        const filePath = path.join(__dirname, requestedPath);
        const normalizedRoot = path.normalize(__dirname + path.sep);

        if (!filePath.startsWith(normalizedRoot)) {
            return new Response("Forbidden", { status: 403 });
}

        try {
            const data = await fs.promises.readFile(filePath);

            const ext = path.extname(filePath).toLowerCase();

            const mimeTypes = {
                ".html": "text/html",
                ".css": "text/css",
                ".js": "text/javascript",
                ".json": "application/json",
                ".png": "image/png",
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".svg": "image/svg+xml",
                ".webp": "image/webp",
                ".ico": "image/x-icon",
                ".woff": "font/woff",
                ".woff2": "font/woff2"
            };

            return new Response(data, {
                headers: {
                    "Content-Type": mimeTypes[ext] || "application/octet-stream"
                }
            });

        } catch (error) {
            return new Response("File not found", {
                status: 404
            });
        }
    });

    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});