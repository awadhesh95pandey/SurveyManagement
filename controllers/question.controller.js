const Question = require('../models/Question');
const Survey = require('../models/Survey');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const xlsx = require('xlsx');

// Set up multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads');
    // Create folder if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Filter file types
const fileFilter = (req, file, cb) => {
  // Accept excel and csv files only
  if (
    file.mimetype === 'application/vnd.ms-excel' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.mimetype === 'text/csv'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only Excel and CSV files are allowed'), false);
  }
};

// Initialize upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB max file size
  },
  fileFilter: fileFilter
}).single('file');

// @desc    Create new question
// @route   POST /api/questions
// @access  Private (Admin only)
exports.createQuestion = async (req, res, next) => {
  try {
    // Check if survey exists
    const survey = await Survey.findById(req.body.surveyId);
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: `Survey not found with id of ${req.body.surveyId}`
      });
    }
    
    // Create question
    const question = await Question.create(req.body);
    
    res.status(201).json({
      success: true,
      data: question
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all questions for a survey
// @route   GET /api/surveys/:surveyId/questions
// @access  Private
exports.getQuestions = async (req, res, next) => {
  try {
    const questions = await Question.find({
      surveyId: req.params.surveyId
    }).sort({ order: 1 });
    
    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single question
// @route   GET /api/questions/:id
// @access  Private
exports.getQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: `Question not found with id of ${req.params.id}`
      });
    }
    
    res.status(200).json({
      success: true,
      data: question
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update question
// @route   PUT /api/questions/:id
// @access  Private (Admin only)
exports.updateQuestion = async (req, res, next) => {
  try {
    let question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: `Question not found with id of ${req.params.id}`
      });
    }
    
    // Get survey to check permissions
    const survey = await Survey.findById(question.surveyId);
    
    // Make sure user is survey creator or admin
    if (survey.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this question`
      });
    }
    
    // Update question
    question = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: question
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Private (Admin only)
exports.deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: `Question not found with id of ${req.params.id}`
      });
    }
    
    // Get survey to check permissions
    const survey = await Survey.findById(question.surveyId);
    
    // Make sure user is survey creator or admin
    if (survey.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this question`
      });
    }
    
    // Delete question using findByIdAndDelete
    await Question.findByIdAndDelete(req.params.id);
    
    // Reorder remaining questions
    const remainingQuestions = await Question.find({
      surveyId: question.surveyId,
      order: { $gt: question.order }
    });
    
    for (const q of remainingQuestions) {
      await Question.findByIdAndUpdate(q._id, {
        order: q.order - 1
      });
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Upload questions from file (Excel or CSV)
// @route   POST /api/surveys/:surveyId/questions/upload
// @access  Private (Admin only)
exports.uploadQuestions = async (req, res, next) => {
  try {
    // Check if survey exists
    const survey = await Survey.findById(req.params.surveyId);
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: `Survey not found with id of ${req.params.surveyId}`
      });
    }
    
    // Make sure user is survey creator or admin
    if (survey.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to upload questions for this survey`
      });
    }
    
    // Handle file upload
    upload(req, res, async function(err) {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload a file'
        });
      }
      
      const filePath = req.file.path;
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      
      let questions = [];
      
      // Parse file based on extension
      if (fileExt === '.csv') {
        // Parse CSV
        const results = [];
        
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', async () => {
            try {
              questions = await processQuestionData(results, req.params.surveyId);
              
              // Delete the file after processing
              fs.unlinkSync(filePath);
              
              res.status(200).json({
                success: true,
                count: questions.length,
                data: questions
              });
            } catch (error) {
              // Delete the file if there's an error
              fs.unlinkSync(filePath);
              
              return res.status(400).json({
                success: false,
                message: error.message
              });
            }
          });
      } else {
        // Parse Excel
        try {
          const workbook = xlsx.readFile(filePath);
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const data = xlsx.utils.sheet_to_json(worksheet);
          
          questions = await processQuestionData(data, req.params.surveyId);
          
          // Delete the file after processing
          fs.unlinkSync(filePath);
          
          res.status(200).json({
            success: true,
            count: questions.length,
            data: questions
          });
        } catch (error) {
          // Delete the file if there's an error
          fs.unlinkSync(filePath);
          
          return res.status(400).json({
            success: false,
            message: error.message
          });
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// Helper function to process question data from file
async function processQuestionData(data, surveyId) {
  // Get the current highest order
  const highestOrderQuestion = await Question.findOne({
    surveyId
  }).sort({ order: -1 });
  
  let startOrder = highestOrderQuestion ? highestOrderQuestion.order + 1 : 1;
  
  const questions = [];
  
  for (const row of data) {
    // Extract question and options
    const questionText = row.Question || row.question;
    
    if (!questionText) {
      throw new Error('Question text is required');
    }
    
    // Extract options (Option 1, Option 2, etc.)
    const options = [];
    for (let i = 1; i <= 4; i++) {
      const optionKey = `Option ${i}` in row ? `Option ${i}` : `option${i}`;
      if (row[optionKey] && row[optionKey].trim()) {
        options.push(row[optionKey].trim());
      }
    }
    
    // Validate options
    if (options.length < 2) {
      throw new Error(`Question "${questionText}" must have at least 2 options`);
    }
    
    // Extract parameter
    const parameter = row.Parameter || row.parameter || null;
    
    // Create question
    const question = await Question.create({
      surveyId,
      questionText,
      options,
      parameter,
      order: startOrder++
    });
    
    questions.push(question);
  }
  
  return questions;
}

// @desc    Download sample question template
// @route   GET /api/questions/sample-template
// @access  Private
exports.downloadSampleTemplate = (req, res, next) => {
  try {
    const format = req.query.format || 'xlsx';
    
    if (format === 'csv') {
      // Create CSV sample
      const csvContent = 'Sno,Question,Option 1,Option 2,Option 3,Option 4,Parameter\n' +
                         '1,"How satisfied are you with your work environment?","Very Satisfied","Satisfied","Neutral","Dissatisfied","Work Environment"\n' +
                         '2,"How would you rate the work-life balance in your role?","Excellent","Good","Fair","Poor","Work-Life Balance"\n' +
                         '3,"Do you feel your contributions are valued?","Always","Often","Sometimes","Rarely","Recognition"';
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=sample_questions.csv');
      
      return res.status(200).send(csvContent);
    } else {
      // Create Excel sample
      const workbook = xlsx.utils.book_new();
      
      const data = [
        { Sno: 1, Question: 'How satisfied are you with your work environment?', 'Option 1': 'Very Satisfied', 'Option 2': 'Satisfied', 'Option 3': 'Neutral', 'Option 4': 'Dissatisfied', Parameter: 'Work Environment' },
        { Sno: 2, Question: 'How would you rate the work-life balance in your role?', 'Option 1': 'Excellent', 'Option 2': 'Good', 'Option 3': 'Fair', 'Option 4': 'Poor', Parameter: 'Work-Life Balance' },
        { Sno: 3, Question: 'Do you feel your contributions are valued?', 'Option 1': 'Always', 'Option 2': 'Often', 'Option 3': 'Sometimes', 'Option 4': 'Rarely', Parameter: 'Recognition' }
      ];
      
      const worksheet = xlsx.utils.json_to_sheet(data);
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Questions');
      
      const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=sample_questions.xlsx');
      
      return res.status(200).send(buffer);
    }
  } catch (err) {
    next(err);
  }
};

