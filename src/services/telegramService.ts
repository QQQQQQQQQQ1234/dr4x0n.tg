import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";
import { NewMessage } from "telegram/events";
import { CustomFile } from "telegram/client/uploads";
import { Buffer } from "buffer";

export class TelegramService {
  private client: TelegramClient | null = null;
  private initializing: boolean = false;

  async initialize(apiId: number, apiHash: string, sessionString: string = "") {
    if (this.initializing) return;
    this.initializing = true;
    try {
      const session = new StringSession(sessionString);
      this.client = new TelegramClient(session, apiId, apiHash, {
        connectionRetries: 5,
        useWSS: true,
      });
      console.log("Telegram Client Initialized");
    } catch (err) {
      console.error("Telegram Initialization Error:", err);
      this.initializing = false;
      throw err;
    }
  }

  async login(params: {
    phoneNumber: () => Promise<string>;
    phoneCode: () => Promise<string>;
    password: () => Promise<string>;
  }) {
    if (!this.client) throw new Error("Client not initialized");
    
    // start() handles the entire flow including 2FA
    await this.client.start({
      phoneNumber: params.phoneNumber,
      phoneCode: params.phoneCode,
      password: params.password,
      onError: (err) => {
        console.error("Telegram Login Error:", err);
      },
    });
    
    return this.client.session.save();
  }

  async getMe() {
    if (!this.client) return null;
    return await this.client.getMe();
  }

  async getDialogs() {
    if (!this.client) return [];
    return await this.client.getDialogs({});
  }

  async getMessages(entity: any, limit: number = 50) {
    if (!this.client) return [];
    return await this.client.getMessages(entity, { limit });
  }

  async downloadMedia(message: any) {
    if (!this.client) return null;
    try {
      const buffer = await this.client.downloadMedia(message, {});
      if (!buffer) return null;
      const blob = new Blob([buffer]);
      return URL.createObjectURL(blob);
    } catch (err) {
      console.error("Download media error:", err);
      return null;
    }
  }

  async uploadFile(file: File) {
    if (!this.client) return null;
    return await this.client.uploadFile({
      file: file,
      workers: 1,
    });
  }

  async sendMedia(entity: any, file: File, caption: string = "", isVideoNote: boolean = false, isVoice: boolean = false) {
    if (!this.client) return null;
    try {
      const buffer = await file.arrayBuffer();
      const toUpload = new CustomFile(file.name, file.size, "", Buffer.from(buffer));
      
      return await this.client.sendFile(entity, {
        file: toUpload,
        caption: caption,
        videoNote: isVideoNote,
        voiceNote: isVoice,
      });
    } catch (err) {
      console.error("Send media error:", err);
      throw err;
    }
  }

  async searchMessages(entity: any, query: string) {
    if (!this.client) return [];
    return await this.client.getMessages(entity, { search: query, limit: 20 });
  }

  async searchGlobal(query: string) {
    if (!this.client) return [];
    const result = await this.client.invoke(new Api.contacts.Search({ q: query, limit: 20 }));
    return result;
  }

  async updateProfile(params: { firstName?: string, lastName?: string, about?: string }) {
    if (!this.client) return null;
    await this.client.invoke(new Api.account.UpdateProfile({
      firstName: params.firstName,
      lastName: params.lastName,
      about: params.about
    }));
    return true;
  }

  async getFullUser(id: any) {
    if (!this.client) return null;
    return await this.client.invoke(new Api.users.GetFullUser({ id }));
  }

  async getFullChat(id: any) {
    if (!this.client) return null;
    return await this.client.invoke(new Api.messages.GetFullChat({ chatId: id }));
  }

  async getFullChannel(channel: any) {
    if (!this.client) return null;
    return await this.client.invoke(new Api.channels.GetFullChannel({ channel }));
  }

  canSendMessages(entity: any): boolean {
    if (!entity) return false;
    // Basic check for channels
    if (entity.className === 'Channel') {
      if (entity.broadcast && !entity.creator && !entity.adminRights) {
        return false;
      }
    }
    return true;
  }

  async searchDialogs(query: string) {
    if (!this.client) return [];
    // @ts-ignore
    const result = await this.client.invoke(new Api.messages.Search({
      q: query,
      peer: new Api.InputPeerEmpty(),
      filter: new Api.InputMessagesFilterEmpty(),
      minDate: 0,
      maxDate: 0,
      offsetId: 0,
      addOffset: 0,
      limit: 20,
      maxId: 0,
      minId: 0,
      hash: BigInt(0) as any
    }));
    return result;
  }

  async sendMessage(entity: any, message: string) {
    if (!this.client) return null;
    return await this.client.sendMessage(entity, { message });
  }

  async getStickerSets() {
    if (!this.client) return [];
    // @ts-ignore
    const result = await this.client.invoke(new Api.messages.GetAllStickers({ hash: BigInt(0) as any }));
    return result;
  }

  onNewMessage(callback: (message: any) => void) {
    if (!this.client) return;
    this.client.addEventHandler((event: any) => {
      if (event instanceof NewMessage) {
        // @ts-ignore
        callback(event.message);
      }
    });
  }
}

export const telegramService = new TelegramService();
