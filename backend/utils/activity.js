function log(db, message, type) {
  db.activityLogs.unshift({
    id: (db.counters.log = (db.counters.log || 0) + 1),
    message,
    type: type || "System",
    createdAt: new Date().toISOString()
  });
}

function notify(db, message, type) {
  db.notifications.unshift({
    id: (db.counters.notification = (db.counters.notification || 0) + 1),
    message,
    type: type || "System",
    read: false,
    createdAt: new Date().toISOString()
  });
}

module.exports = { log, notify };
