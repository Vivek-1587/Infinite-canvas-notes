import type { Workspace } from "@/lib/types";

export interface PeerSyncMessage {
  type: "workspace";
  sentAt: number;
  workspace: Workspace;
}

export type PeerSyncHandler = (workspace: Workspace) => void;

export class PeerSyncSession {
  private connection: RTCPeerConnection;
  private channel: RTCDataChannel | null = null;
  private readonly onWorkspace: PeerSyncHandler;

  constructor(onWorkspace: PeerSyncHandler) {
    this.onWorkspace = onWorkspace;
    this.connection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    this.connection.addEventListener("datachannel", (event) => {
      this.attachChannel(event.channel);
    });
  }

  async createOffer(): Promise<string> {
    this.attachChannel(this.connection.createDataChannel("workspace"));
    const offer = await this.connection.createOffer();
    await this.connection.setLocalDescription(offer);
    await this.waitForIceGathering();
    return JSON.stringify(this.connection.localDescription);
  }

  async acceptOffer(serializedOffer: string): Promise<string> {
    const offer = JSON.parse(serializedOffer) as RTCSessionDescriptionInit;
    await this.connection.setRemoteDescription(offer);
    const answer = await this.connection.createAnswer();
    await this.connection.setLocalDescription(answer);
    await this.waitForIceGathering();
    return JSON.stringify(this.connection.localDescription);
  }

  async acceptAnswer(serializedAnswer: string): Promise<void> {
    const answer = JSON.parse(serializedAnswer) as RTCSessionDescriptionInit;
    await this.connection.setRemoteDescription(answer);
  }

  sendWorkspace(workspace: Workspace): boolean {
    if (this.channel?.readyState !== "open") return false;
    const message: PeerSyncMessage = {
      type: "workspace",
      sentAt: Date.now(),
      workspace
    };
    this.channel.send(JSON.stringify(message));
    return true;
  }

  close(): void {
    this.channel?.close();
    this.connection.close();
  }

  private attachChannel(channel: RTCDataChannel): void {
    this.channel = channel;
    channel.addEventListener("message", (event: MessageEvent<string>) => {
      const message = JSON.parse(event.data) as PeerSyncMessage;
      if (message.type === "workspace") {
        this.onWorkspace(message.workspace);
      }
    });
  }

  private waitForIceGathering(): Promise<void> {
    if (this.connection.iceGatheringState === "complete") {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const listener = () => {
        if (this.connection.iceGatheringState === "complete") {
          this.connection.removeEventListener("icegatheringstatechange", listener);
          resolve();
        }
      };
      this.connection.addEventListener("icegatheringstatechange", listener);
    });
  }
}
