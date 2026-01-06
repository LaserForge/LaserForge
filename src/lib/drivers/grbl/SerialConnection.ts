export type SerialConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export interface SerialConnectionEvents {
  onData: (data: string) => void;
  onStateChange: (state: SerialConnectionState) => void;
  onError: (error: Error) => void;
}

export class SerialConnection {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<string> | null = null;
  private writer: WritableStreamDefaultWriter<string> | null = null;

  private state: SerialConnectionState = "disconnected";

  private events: SerialConnectionEvents;

  constructor(events: SerialConnectionEvents) {
    this.events = events;
  }

  public async connect(baudRate: number = 115200): Promise<void> {
    if (!("serial" in navigator)) {
      this.handleError(
        new Error("Web Serial API not supported in this browser.")
      );
      return;
    }

    try {
      this.setState("connecting");
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate });

      if (this.port.readable && this.port.writable) {
        // Setup Writer
        const textEncoder = new TextEncoderStream();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        textEncoder.readable.pipeTo(this.port.writable as WritableStream<any>);
        this.writer = textEncoder.writable.getWriter();

        // Setup Reader
        this.setupReader();

        this.setState("connected");
      } else {
        throw new Error("Port is not readable or writable.");
      }
    } catch (error) {
      this.handleError(
        error instanceof Error ? error : new Error(String(error))
      );
      this.setState("error");
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader.releaseLock();
        this.reader = null;
      }
      if (this.writer) {
        await this.writer.close();
        this.writer.releaseLock();
        this.writer = null;
      }
      if (this.port) {
        await this.port.close();
        this.port = null;
      }
      this.setState("disconnected");
    } catch (error) {
      this.handleError(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  public async send(data: string): Promise<void> {
    if (!this.writer || this.state !== "connected") {
      throw new Error("Serial port is not connected.");
    }
    await this.writer.write(data);
  }

  private async setupReader() {
    if (!this.port?.readable) return;

    const textDecoder = new TextDecoderStream();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.port.readable.pipeTo(textDecoder.writable as WritableStream<any>);
    this.reader = textDecoder.readable.getReader();

    try {
      while (true) {
        const { value, done } = await this.reader.read();
        if (done) {
          this.reader.releaseLock();
          break;
        }
        if (value) {
          this.events.onData(value);
        }
      }
    } catch (error) {
      this.handleError(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  private setState(newState: SerialConnectionState) {
    this.state = newState;
    this.events.onStateChange(newState);
  }

  private handleError(error: Error) {
    console.error("SerialConnection Error:", error);
    this.events.onError(error);
  }
}
