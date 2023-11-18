const express = require('express');
const coursesController = require('../controllers/coursesController');
const verifyToken = require('../middlewares/authMiddleware');

const router = express.Router();

// Specific routes
router.get('/', coursesController.getCourses);
router.post('/userOrder', verifyToken, coursesController.getCoursesByUserOrder);
router.post('/updateCourseOrder', verifyToken, coursesController.updateCourseOrder);
router.get('/:courseId', coursesController.getCourseById);

// CRUD operations
router.post('/', coursesController.createCourse);
router.put('/:courseId', coursesController.updateCourse);
router.delete('/:courseId', coursesController.deleteCourse);

module.exports = router;
