import { Buffer } from 'buffer';


class WebSocketUtils {
    private socketUrl: string = "ws://150.158.53.182:8080/ws";
    private socket: WebSocket | null = null;
    private listeners: { eventType: string; callback: Function }[] = [];
    private pendingPackets: any[] = [];

    connect(url?: string) {
        if(!url) {
            url = this.socketUrl;
        }

        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            return;
        }

        this.socket = new WebSocket(url);
        this.socket.binaryType = 'arraybuffer';

        this.socket.onopen = async () => {
            console.log('WebSocket connected');
            await this.notifyListenersAsync('open');
            this.flushPendingPackets();
        };

        this.socket.onmessage = (event) => {
            const data = event.data; // The binary data received from the server
            let messageText = '';

            if (typeof data === 'string') {
                messageText = data;
            } else {
                const packetBuffer = data instanceof ArrayBuffer
                    ? Buffer.from(data)
                    : ArrayBuffer.isView(data)
                        ? Buffer.from(data.buffer, data.byteOffset, data.byteLength)
                        : Buffer.from(data);

                if (packetBuffer.length < 4) {
                    return;
                }

                const messageLength = packetBuffer.readInt32BE(0);
                if (packetBuffer.length < 4 + messageLength) {
                    return;
                }
                const messageBuffer = packetBuffer.subarray(4, 4 + messageLength);
                messageText = messageBuffer.toString('utf-8');
            }

            this.notifyListeners('message', messageText);
            this.notifyListeners('chatMessage', messageText);
        };

        this.socket.onclose = () => {
            console.log('WebSocket disconnected');
            this.socket = null;
            this.notifyListeners('close');
        };

        this.socket.onerror = (error) => {
            console.log('WebSocket error', error);
            this.notifyListeners('error', error);
        };
    }

    send(userImei: string,
        userToken: string,
        userCommand: number,
        userClientType: number,
        jsonData: string) {

        const data = this.build(userImei, userToken, userCommand, userClientType, jsonData);
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(data);
        } else {
            this.pendingPackets.push(data);
            this.connect();
        }

    }

    isConnected() {
        return this.socket?.readyState === WebSocket.OPEN;
    }

    addListener(eventType: string, callback: Function) {
        if (!this.listeners.some(listener => listener.eventType === eventType && listener.callback === callback)) {
            this.listeners.push({ eventType, callback });
        }
    }

    removeListener(callback: Function) {
        this.listeners = this.listeners.filter(listener => listener.callback !== callback);
    }

    notifyListeners(eventType: string, data?: any) {
        this.listeners.forEach(listener => {
            if (listener.eventType === eventType) {
                listener.callback(data);
            }
        });
    }

    private async notifyListenersAsync(eventType: string, data?: any) {
        const callbacks = this.listeners
            .filter(listener => listener.eventType === eventType)
            .map(listener => Promise.resolve(listener.callback(data)));

        await Promise.all(callbacks);
    }

    close() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    private flushPendingPackets() {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            return;
        }

        const packets = [...this.pendingPackets];
        this.pendingPackets = [];
        packets.forEach(packet => this.socket?.send(packet));
    }


    build(
        userImei: string,
        userToken: string,
        userCommand: number,
        userClientType: number,
        jsonData: string): any {
        const imei = Buffer.from(userImei);
        const imeiLength = imei.length;
        const imeiLengthBytes = Buffer.alloc(4);
        imeiLengthBytes.writeInt32BE(imeiLength, 0);

        const token = Buffer.from(userToken);
        const tokenLength = token.length;
        const tokenLengthBytes = Buffer.alloc(4);
        tokenLengthBytes.writeInt32BE(tokenLength, 0);

        const command = Buffer.alloc(4);
        command.writeInt32BE(userCommand, 0);

        const clientType = Buffer.from([userClientType]);

        const body = Buffer.from(jsonData, 'utf-8');
        const bodyLength = body.length;
        const bodyLengthBytes = Buffer.alloc(4);
        bodyLengthBytes.writeInt32BE(bodyLength, 0);

        const concatenatedBuffer = Buffer.concat([
            command,
            clientType,
            tokenLengthBytes,
            imeiLengthBytes,
            bodyLengthBytes,
            token,
            imei,
            body
        ]);

        return concatenatedBuffer;
    }

}

export default new WebSocketUtils();
