export function notify(title, msg) {
  if ("Notification" in window) {
    Notification.requestPermission().then(function(result) {
      console.log('💬 '+title)
      var n = new Notification(title, { body: msg })
      setTimeout(n.close.bind(n), 1000 + (title.length+msg.length)*70)
    });
  }
}
