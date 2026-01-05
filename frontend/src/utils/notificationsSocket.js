class NotificationSocket {
  constructor() {
    this.socket = null;
    this.callbacks = {
      onNotification: () => {},
      onCountUpdate: () => {}
    };
  }

  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    // WebSocket URL - adjust based on your server
    const wsUrl = `ws://${window.location.host}/ws/notifications?token=${token}`;
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('Notification WebSocket connected');
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch(data.type) {
          case 'new_notification':
            this.callbacks.onNotification(data.notification);
            break;
          case 'count_update':
            this.callbacks.onCountUpdate(data.counts);
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.socket.onclose = () => {
      console.log('Notification WebSocket disconnected');
      // Attempt to reconnect after 5 seconds
      setTimeout(() => this.connect(token), 5000);
    };

    this.socket.onerror = (error) => {
      console.error('Notification WebSocket error:', error);
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  onNotification(callback) {
    this.callbacks.onNotification = callback;
  }

  onCountUpdate(callback) {
    this.callbacks.onCountUpdate = callback;
  }
}

export default new NotificationSocket();