import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import AdmZip from "adm-zip";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API to fetch a github repo as zip, extract it, and return file contents
  app.post("/api/fetch-repo", async (req, res) => {
    try {
      const { githubUrl } = req.body;
      if (!githubUrl || !githubUrl.includes("github.com")) {
        return res.status(400).json({ error: "Invalid github URL" });
      }

      // Convert github url to standard zipball url
      // e.g. https://github.com/facebook/react -> https://github.com/facebook/react/archive/refs/heads/main.zip
      // Wait, we can use github api or just download the zip.
      // Easiest is to try fetching /archive/refs/heads/main.zip or master.zip
      
      const parsedUrl = new URL(githubUrl);
      const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
      if (pathParts.length < 2) {
        return res.status(400).json({ error: "Could not parse repository owner and name" });
      }
      
      const owner = pathParts[0];
      const repo = pathParts[1];
      
      // Let's use api.github.com/repos/{owner}/{repo} to find the default branch if we can, but we can also just fetch /zipball/HEAD or /zipball/main
      // Wait, let's use github API to get the default branch to be safe, but that requires auth to not be rate limited.
      // Trying common default branches without API:
      let zipBuffer: ArrayBuffer | null = null;
      let branchUsed = '';
      
      const branches = ['main', 'master'];
      for (const branch of branches) {
        const zipUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.zip`;
        const response = await fetch(zipUrl);
        if (response.ok) {
          zipBuffer = await response.arrayBuffer();
          branchUsed = branch;
          break;
        }
      }
      
      if (!zipBuffer) {
         return res.status(404).json({ error: "Could not download repository. Ensure it is public and has a main or master branch." });
      }

      const zip = new AdmZip(Buffer.from(zipBuffer));
      const zipEntries = zip.getEntries();
      
      // Filter out binaries and irrelevant files
      const textFiles = [];
      const ignoredExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.mp3', '.pdf', '.zip', '.tar', '.gz'];
      const ignoredPaths = ['node_modules/', 'dist/', '.git/', 'build/', 'coverage/'];
      
      for (const entry of zipEntries) {
        if (!entry.isDirectory) {
          const name = entry.entryName;
          
          let ext = path.extname(name).toLowerCase();
          
          if (ignoredExtensions.includes(ext)) {
            continue;
          }
          
          let shouldIgnore = false;
          for (const ignoredPath of ignoredPaths) {
            if (name.includes(ignoredPath)) {
              shouldIgnore = true;
              break;
            }
          }
          if (shouldIgnore) continue;

          const content = entry.getData().toString("utf8");
          // remove the leading root directory name
          const relativePath = name.split('/').slice(1).join('/');
          
          if (relativePath) {
            textFiles.push({
              path: relativePath,
              content: content
            });
          }
        }
      }

      res.json({ files: textFiles, branch: branchUsed });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to fetch repository" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
