const {
  getAllAcademicTerms,
  getCurrentAcademicTerm,
  getAcademicTermById,
  createAcademicTerm,
  updateAcademicTerm,
  setCurrentAcademicTerm,
  deleteAcademicTerm,
  getStudentCountByTerm
} = require('../models/academicTermModel');


exports.getAcademicTerms = async (req, res) => {
  try {
    const terms = await getAllAcademicTerms();

    const termsWithCounts = await Promise.all(
      terms.map(async (term) => ({
        ...term,
        student_count: await getStudentCountByTerm(term.id)
      }))
    );
    
    res.status(200).json({
      success: true,
      data: termsWithCounts
    });
  } catch (error) {
    console.error('Error fetching academic terms:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch academic terms'
    });
  }
};


exports.getCurrentTerm = async (req, res) => {
  try {
    const currentTerm = await getCurrentAcademicTerm();
    
    if (!currentTerm) {
      return res.status(404).json({
        success: false,
        message: 'No current academic term set'
      });
    }

    const studentCount = await getStudentCountByTerm(currentTerm.id);
    
    res.status(200).json({
      success: true,
      data: {
        ...currentTerm,
        student_count: studentCount
      }
    });
  } catch (error) {
    console.error('Error fetching current academic term:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch current academic term'
    });
  }
};

exports.getAcademicTermById = async (req, res) => {
  try {
    const { id } = req.params;
    const term = await getAcademicTermById(id);
    
    if (!term) {
      return res.status(404).json({
        success: false,
        message: 'Academic term not found'
      });
    }

    const studentCount = await getStudentCountByTerm(term.id);
    
    res.status(200).json({
      success: true,
      data: {
        ...term,
        student_count: studentCount
      }
    });
  } catch (error) {
    console.error('Error fetching academic term:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch academic term'
    });
  }
};

exports.createAcademicTerm = async (req, res) => {
  try {
    const { school_year, term, is_current } = req.body;

    if (!school_year || !term) {
      return res.status(400).json({
        success: false,
        message: 'School year and term are required'
      });
    }

    const newTerm = await createAcademicTerm(school_year, term, is_current || false);
    
    res.status(201).json({
      success: true,
      message: 'Academic term created successfully',
      data: newTerm
    });
  } catch (error) {
    console.error('Error creating academic term:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create academic term'
    });
  }
};

exports.updateAcademicTerm = async (req, res) => {
  try {
    const { id } = req.params;
    const { school_year, term } = req.body;

    if (!school_year || !term) {
      return res.status(400).json({
        success: false,
        message: 'School year and term are required'
      });
    }

    const updatedTerm = await updateAcademicTerm(id, school_year, term);
    
    res.status(200).json({
      success: true,
      message: 'Academic term updated successfully',
      data: updatedTerm
    });
  } catch (error) {
    console.error('Error updating academic term:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update academic term'
    });
  }
};


exports.setCurrentTerm = async (req, res) => {
  try {
    const { id } = req.params;
    
    const currentTerm = await setCurrentAcademicTerm(id);
    
    res.status(200).json({
      success: true,
      message: 'Current academic term updated successfully',
      data: currentTerm
    });
  } catch (error) {
    console.error('Error setting current academic term:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to set current academic term'
    });
  }
};

exports.deleteAcademicTerm = async (req, res) => {
  try {
    const { id } = req.params;
    
    await deleteAcademicTerm(id);
    
    res.status(200).json({
      success: true,
      message: 'Academic term deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting academic term:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete academic term'
    });
  }
};

