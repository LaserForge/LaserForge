import {
  SerialConnection,
  type SerialConnectionState,
} from "./SerialConnection";
import { create } from "zustand";

export interface GrblState {
  status:
    | "Idle"
    | "Run"
    | "Hold"
    | "Jog"
    | "Alarm"
    | "Door"
    | "Check"
    | "Home"
    | "Sleep";
  wco: { x: number; y: number; z: number };
  mpos: { x: number; y: number; z: number };
  feedRate: number;
  spindleSpeed: number;
  connectionState: SerialConnectionState;
}

interface GrblStore extends GrblState {
  setGrblState: (partial: Partial<GrblState>) => void;
  appendLog: (message: string) => void;
  logs: string[];
}

export const useGrblStore = create<GrblStore>((set) => ({
  status: "Idle",
  wco: { x: 0, y: 0, z: 0 },
  mpos: { x: 0, y: 0, z: 0 },
  feedRate: 0,
  spindleSpeed: 0,
  connectionState: "disconnected",
  logs: [],
  setGrblState: (partial) => set((state) => ({ ...state, ...partial })),
  appendLog: (msg) =>
    set((state) => ({ logs: [...state.logs.slice(-99), msg] })),
}));

export class GrblController {
  private connection: SerialConnection;
  private buffer: string[] = [];
  private sentCommands: number[] = [];
  private bufferSize: number = 0;
  private constantBufferSize: number = 127; // GRBL Rx buffer size

  constructor() {
    this.connection = new SerialConnection({
      onData: (data) => this.handleData(data),
      onStateChange: (state) =>
        useGrblStore.getState().setGrblState({ connectionState: state }),
      onError: (err) =>
        useGrblStore.getState().appendLog(`Error: ${err.message}`),
    });
  }

  public async connect() {
    await this.connection.connect();
    // Wake up GRBL
    await this.connection.send("\r\n\r\n");
    setTimeout(() => this.connection.send("$X\n"), 500); // Unlock if alarm
  }

  public async disconnect() {
    await this.connection.disconnect();
  }

  public sendGCode(gcode: string) {
    const lines = gcode.split("\n");
    for (const line of lines) {
      if (line.trim().length > 0) {
        this.buffer.push(line.trim());
      }
    }
    this.processBuffer();
  }

  private async processBuffer() {
    while (this.buffer.length > 0) {
      const nextLine = this.buffer[0];
      const cmdLen = nextLine.length + 1; // +1 for newline

      if (this.bufferSize + cmdLen <= this.constantBufferSize) {
        const line = this.buffer.shift();
        if (line) {
          this.bufferSize += cmdLen;
          this.sentCommands.push(cmdLen);
          useGrblStore.getState().appendLog(`> ${line}`);
          await this.connection.send(line + "\n");
        }
      } else {
        // Buffer full, wait for 'ok'
        break;
      }
    }
  }

  private handleData(data: string) {
    const cleanData = data.trim();
    if (!cleanData) return;

    // Acknowledge logic
    if (cleanData === "ok") {
      const sentLen = this.sentCommands.shift();
      if (sentLen) {
        this.bufferSize -= sentLen;
      }
      this.processBuffer();
    } else if (cleanData.startsWith("error:")) {
      useGrblStore.getState().appendLog(`Error from GRBL: ${cleanData}`);
      const sentLen = this.sentCommands.shift();
      if (sentLen) {
        this.bufferSize -= sentLen;
      }
      this.processBuffer();
    } else if (cleanData.startsWith("<")) {
      this.parseStatus(cleanData);
    } else {
      useGrblStore.getState().appendLog(cleanData);
    }
  }

  private parseStatus(statusLine: string) {
    // Example: <Idle|MPos:0.000,0.000,0.000|FS:0,0>
    // Remove < and >
    const content = statusLine.slice(1, -1);
    const parts = content.split("|");
    const status = parts[0] as GrblState["status"];

    const updates: Partial<GrblState> = { status };

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (part.startsWith("MPos:")) {
        const coords = part.substring(5).split(",").map(Number);
        updates.mpos = { x: coords[0], y: coords[1], z: coords[2] };
      } else if (part.startsWith("WPos:")) {
        // GRBL might report WPos instead
        // We might calculate MPos based on WCO if needed, but for now just ignoring or mapping
      } else if (part.startsWith("FS:")) {
        const fs = part.substring(3).split(",").map(Number);
        updates.feedRate = fs[0];
        updates.spindleSpeed = fs[1];
      } else if (part.startsWith("WCO:")) {
        const coords = part.substring(4).split(",").map(Number);
        updates.wco = { x: coords[0], y: coords[1], z: coords[2] };
      }
    }

    useGrblStore.getState().setGrblState(updates);
  }
}

export const grblController = new GrblController();
