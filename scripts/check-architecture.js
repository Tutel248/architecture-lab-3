import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, "../src");

let violations = [];

function getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const stat = fs.statSync(path.join(dir, file));
        if (stat.isDirectory()) {
            getAllFiles(path.join(dir, file), fileList);
        } else if (file.endsWith(".ts") || file.endsWith(".js")) {
            fileList.push(path.join(dir, file));
        }
    }
    return fileList;
}

const allFiles = getAllFiles(srcDir);

for (const filePath of allFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const relPath = path.relative(srcDir, filePath).replace(/\\/g, "/");
    const currentModule = relPath.split("/")[0];

    const importRegex = /from\s+["'](\.\.?\/[^"']+)["']/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (importPath.includes("/internal/")) {
            const resolved = path.normalize(path.join(path.dirname(filePath), importPath)).replace(/\\/g, "/");
            const targetRelPath = path.relative(srcDir, resolved).replace(/\\/g, "/");
            const targetModule = targetRelPath.split("/")[0];

            if (currentModule !== targetModule) {
                violations.push(`[FORBIDDEN INTERNAL IMPORT] File "${relPath}" imports internal file "${targetRelPath}" from module "${targetModule}".`);
            }
        }
    }
}

for (const filePath of allFiles) {
    const relPath = path.relative(srcDir, filePath).replace(/\\/g, "/");
    if (!relPath.startsWith("inventory/") && !relPath.startsWith("database.ts") && relPath !== "demo.ts") {
        const content = fs.readFileSync(filePath, "utf-8");
        if (content.includes("database.stock") && (content.includes(".set(") || content.includes(".clear("))) {
            violations.push(`[DIRECT STORAGE WRITE] File "${relPath}" directly mutates Inventory database.stock.`);
        }
    }
}

const importGraph = {};
for (const filePath of allFiles) {
    const relPath = path.relative(srcDir, filePath).replace(/\\/g, "/");
    importGraph[relPath] = [];
    const content = fs.readFileSync(filePath, "utf-8");
    const importRegex = /from\s+["'](\.\.?\/[^"']+)["']/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        let imp = match[1];
        if (!imp.endsWith(".ts") && !imp.endsWith(".js")) imp += ".ts";
        const resolvedAbs = path.normalize(path.join(path.dirname(filePath), imp));
        const resolvedRel = path.relative(srcDir, resolvedAbs).replace(/\\/g, "/");
        if (fs.existsSync(resolvedAbs)) {
            importGraph[relPath].push(resolvedRel);
        }
    }
}

function findCycle(graph) {
    const visited = new Set();
    const stack = new Set();
    const pathArr = [];

    for (const node of Object.keys(graph)) {
        if (!visited.has(node)) {
            const cycle = dfs(node, visited, stack, pathArr, graph);
            if (cycle) return cycle;
        }
    }
    return null;
}

function dfs(node, visited, stack, pathArr, graph) {
    visited.add(node);
    stack.add(node);
    pathArr.push(node);

    for (const neighbor of graph[node] || []) {
        if (!visited.has(neighbor)) {
            const cycle = dfs(neighbor, visited, stack, pathArr, graph);
            if (cycle) return cycle;
        } else if (stack.has(neighbor)) {
            const startIndex = pathArr.indexOf(neighbor);
            return pathArr.slice(startIndex).concat(neighbor);
        }
    }
    stack.delete(node);
    pathArr.pop();
    return null;
}

const cycle = findCycle(importGraph);
if (cycle) {
    violations.push(`[DEPENDENCY CYCLE DETECTED] Cycle: ${cycle.join(" -> ")}`);
}

if (violations.length > 0) {
    console.error("ARCHITECTURE CHECK FAILED WITH VIOLATIONS:");
    for (const v of violations) {
        console.error(`  - ${v}`);
    }
    process.exit(1);
} else {
    console.log("ARCHITECTURE CHECK PASSED: All boundary, ownership, and cycle rules are satisfied!");
    process.exit(0);
}