import { spawn, ChildProcess } from "child_process";
import path from "path";

class BiRefNetBridge {
  private proc: ChildProcess | null = null;
  private buffer: string = "";
  private resolvers: Map<string, { resolve: (val: string) => void; reject: (err: Error) => void }> = new Map();
  private reqCounter = 0;
  private initializingPromise: Promise<void> | null = null;

  constructor() {
    // Lazy spawn on first background removal request
  }

  private initProcess(): Promise<void> {
    if (this.initializingPromise) return this.initializingPromise;

    this.initializingPromise = new Promise((resolve, reject) => {
      const scriptPath = path.join(process.cwd(), "lib", "remove_bg_server.py");
      let resolved = false;

      const trySpawn = (cmd: string) => {
        console.log(`[BiRefNetBridge] Spawning background worker: ${cmd} ${scriptPath}`);
        const p = spawn(cmd, [scriptPath]);
        this.proc = p;

        p.stderr?.on("data", (data) => {
          console.error(`[BiRefNetBridge Python Stderr] ${data.toString().trim()}`);
        });

        p.stdout?.on("data", (data) => {
          this.buffer += data.toString();
          this.processBuffer();
        });

        p.on("error", (err: any) => {
          if (cmd === "python3" && err.code === "ENOENT") {
            console.warn("[BiRefNetBridge] python3 not found, trying python...");
            trySpawn("python");
          } else {
            console.error("[BiRefNetBridge] Process error:", err);
            if (!resolved) {
              resolved = true;
              this.cleanup(err);
              reject(err);
            }
          }
        });

        p.on("close", (code) => {
          console.warn(`[BiRefNetBridge] Python process exited with code ${code}`);
          this.cleanup(new Error(`Python process exited with code ${code}`));
        });

        // Resolve after the process has successfully spawned (without ENOENT)
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve();
          }
        }, 500);
      };

      trySpawn("python3");
    });

    return this.initializingPromise;
  }

  private processBuffer() {
    let newlineIndex = this.buffer.indexOf("\n");
    while (newlineIndex !== -1) {
      const line = this.buffer.slice(0, newlineIndex).trim();
      this.buffer = this.buffer.slice(newlineIndex + 1);
      
      if (line) {
        try {
          const res = JSON.parse(line);
          const { req_id, status, image, error } = res;
          
          if (req_id) {
            const handler = this.resolvers.get(req_id);
            if (handler) {
              if (status === "success") {
                handler.resolve(image);
              } else {
                handler.reject(new Error(error || "Unknown background removal error"));
              }
              this.resolvers.delete(req_id);
            }
          }
        } catch (e) {
          console.error("[BiRefNetBridge] Error parsing stdout line:", e, "Line:", line);
        }
      }
      newlineIndex = this.buffer.indexOf("\n");
    }
  }

  private cleanup(err: Error) {
    this.proc = null;
    this.initializingPromise = null;
    // Reject all pending resolvers
    for (const [_, handler] of this.resolvers.entries()) {
      handler.reject(err);
    }
    this.resolvers.clear();
  }

  public async removeBackground(imageBufferBase64: string): Promise<string> {
    await this.initProcess();
    
    if (!this.proc || !this.proc.stdin) {
      throw new Error("Python background process is not running or stdin is unavailable.");
    }

    const reqId = (++this.reqCounter).toString();
    const promise = new Promise<string>((resolve, reject) => {
      this.resolvers.set(reqId, { resolve, reject });
    });

    const payload = JSON.stringify({ req_id: reqId, image: imageBufferBase64 }) + "\n";
    this.proc.stdin.write(payload);

    return promise;
  }

  public shutdown() {
    if (this.proc) {
      this.proc.kill("SIGTERM");
      this.proc = null;
      this.initializingPromise = null;
    }
  }
}

// Keep a single instance on the Node global object to survive dev server hot-reloads
const globalForBridge = global as unknown as {
  birefnetBridge?: BiRefNetBridge;
};

export const birefnetBridge =
  globalForBridge.birefnetBridge || new BiRefNetBridge();

if (process.env.NODE_ENV !== "production") {
  globalForBridge.birefnetBridge = birefnetBridge;
}
