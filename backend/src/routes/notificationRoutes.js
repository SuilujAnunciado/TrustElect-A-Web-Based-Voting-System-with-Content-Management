const express = require("express");
const pool = require("../config/db");
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  markReadByEntity
} = require("../controllers/notificationController");
const { verifyToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(verifyToken);


router.get("/", getNotifications);

router.get("/unread-count", getUnreadCount);

router.put("/:id/read", markAsRead);

router.put("/read-all", markAllAsRead);

router.put("/markReadByEntity", markReadByEntity);

router.delete("/:id", deleteNotification);

router.delete("/", deleteAllNotifications);


module.exports = router; 