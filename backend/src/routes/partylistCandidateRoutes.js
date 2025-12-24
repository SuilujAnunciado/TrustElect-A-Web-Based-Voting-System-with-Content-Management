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


router.get("/:partylistId/candidates", getPartylistCandidates);

router.post("/:partylistId/candidates", verifyToken, (req, res, next) => {
  if (req.user.role_id === 1 || req.user.role_id === 2) {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied' });
  }
}, addPartylistCandidate);

router.delete("/candidates/:candidateId", verifyToken, (req, res, next) => {
  if (req.user.role_id === 1 || req.user.role_id === 2) {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied' });
  }
}, removePartylistCandidate);

router.put("/candidates/:candidateId", verifyToken, (req, res, next) => {
  if (req.user.role_id === 1 || req.user.role_id === 2) {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied' });
  }
}, updatePartylistCandidate);

router.get("/student/:studentNumber", verifyToken, getStudentPartylist);

router.post(
  "/upload-image",
  verifyToken,
  (req, res, next) => {
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