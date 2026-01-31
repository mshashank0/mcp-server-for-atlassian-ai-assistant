#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const servers = [
    { script: join(__dirname, 'bitbucket', 'index.js'), name: 'Bitbucket MCP' },
    { script: join(__dirname, 'confluence', 'index.js'), name: 'Confluence MCP' },
    { script: join(__dirname, 'jira', 'index.js'), name: 'Jira MCP' },
];
const processes = [];
function startAllServers() {
    servers.forEach(({ script, name }) => {
        const proc = spawn('node', [script], {
            stdio: 'inherit',
        });
        console.log(`${name} started (PID: ${proc.pid})`);
        processes.push(proc);
        proc.on('error', (error) => {
            console.error(`Error starting ${name}:`, error);
        });
        proc.on('exit', (code, signal) => {
            console.log(`${name} exited with code ${code} and signal ${signal}`);
        });
    });
}
function terminateAll() {
    console.log('Shutting down all MCP servers...');
    processes.forEach((proc) => {
        try {
            proc.kill();
        }
        catch (error) {
            // Ignore errors during shutdown
        }
    });
    process.exit(0);
}
// Handle process signals
process.on('SIGINT', terminateAll);
process.on('SIGTERM', terminateAll);
// Start all servers
startAllServers();
// Wait for all processes
processes.forEach((proc) => {
    proc.on('exit', () => {
        // Check if all processes have exited
        const allExited = processes.every((p) => p.exitCode !== null);
        if (allExited) {
            console.log('All MCP servers have exited');
            process.exit(0);
        }
    });
});
//# sourceMappingURL=index.js.map