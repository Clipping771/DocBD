// WebSocket Live Synchronization Client Service
import { WS_BASE } from '../config.js';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map(); // event -> callback[]
    this.statusListeners = [];
  }

  init() {
    this._connect();
  }

  _connect() {
    try {
      this.socket = new WebSocket(WS_BASE);

      this.socket.onopen = () => {
        this.isConnected = true;
        this._notifyStatus(true);
        this.sendAction('GET_STATE', { chamberId: 'ch-pop-302' });
      };

      this.socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this._emit(payload.event, payload.data);
        } catch (err) {}
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this._notifyStatus(false);
        setTimeout(() => this._connect(), 3000);
      };

      this.socket.onerror = () => {
        this.isConnected = false;
        this._notifyStatus(false);
      };
    } catch (e) {
      this.isConnected = false;
      this._notifyStatus(false);
    }
  }

  sendAction(action, data = {}, chamberId = 'ch-pop-302') {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        action,
        chamberId,
        data
      }));
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  onStatusChange(callback) {
    this.statusListeners.push(callback);
  }

  _emit(event, data) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const h of handlers) h(data);
    }
  }

  _notifyStatus(connected) {
    for (const l of this.statusListeners) l(connected);
  }
}

export const wsService = new WebSocketService();
