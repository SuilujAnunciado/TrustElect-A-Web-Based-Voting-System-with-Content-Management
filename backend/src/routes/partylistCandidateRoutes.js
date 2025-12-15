const express = require("express");
const { 
  addPartylistCandidate, 
  getPartylistCandidates, 
  removePartylistCandidate, 
  updatePartylistCandidate,
  getStudentPartylist,
  uploadCandidateImage
} = require("../controllers/partylistCandidateController");
const { verifyToken, isSuperAdmin} = require("../middlewares/authMiddleware");
const { checkPermission } = require("../middlewares/permissionMiddleware");
const { candidateUploadMiddleware } = require("../middlewares/candidateUploadMiddleware");
const router = express.Router();

<<<<<<< HEAD

router.get("/:partylistId/candidates", getPartylistCandidates);

router.post("/:partylistId/candidates", verifyToken, (req, res, next) => {
=======
// Get all candidates for a partylist
router.get("/:partylistId/candidates", getPartylistCandidates);

// Add a candidate to a partylist
router.post("/:partylistId/candidates", verifyToken, (req, res, next) => {
  // Allow both Super Admin and Admin to manage partylist candidates
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  if (req.user.role_id === 1 || req.user.role_id === 2) {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied' });
  }
}, addPartylistCandidate);

<<<<<<< HEAD
router.delete("/candidates/:candidateId", verifyToken, (req, res, next) => {
=======
// Remove a candidate from a partylist
router.delete("/candidates/:candidateId", verifyToken, (req, res, next) => {
  // Allow both Super Admin and Admin to manage partylist candidates
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  if (req.user.role_id === 1 || req.user.role_id === 2) {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied' });
  }
}, removePartylistCandidate);

<<<<<<< HEAD
router.put("/candidates/:candidateId", verifyToken, (req, res, next) => {
=======
// Update a candidate
router.put("/candidates/:candidateId", verifyToken, (req, res, next) => {
  // Allow both Super Admin and Admin to manage partylist candidates
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  if (req.user.role_id === 1 || req.user.role_id === 2) {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied' });
  }
}, updatePartylistCandidate);

<<<<<<< HEAD
router.get("/student/:studentNumber", verifyToken, getStudentPartylist);

=======
// Get student's partylist
router.get("/student/:studentNumber", verifyToken, getStudentPartylist);

// Image upload route
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
router.post(
  "/upload-image",
  verifyToken,
  (req, res, next) => {
<<<<<<< HEAD
=======
    // Allow both Super Admin and Admin to upload candidate images
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    if (req.user.role_id === 1 || req.user.role_id === 2) {
      next();
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
  },
  candidateUploadMiddleware.single("image"),
  uploadCandidateImage
);

module.exports = router; 