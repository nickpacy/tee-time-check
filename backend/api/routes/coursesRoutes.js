const express = require('express');
const coursesController = require('../controllers/coursesController');
const { verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Specific routes
router.get('/', coursesController.getCourses);
router.post('/userOrder', verifyToken, coursesController.getCoursesByUserOrder);
router.post('/updateCourseOrder', verifyToken, coursesController.updateCourseOrder);
router.get('/distance', verifyToken, coursesController.getCoursesByDistance);
router.get('/:courseId', coursesController.getCourseById);
router.post('/addUserCourse', verifyToken, coursesController.addUserCourse);
router.delete('/removeUserCourse/:courseId', verifyToken, coursesController.removeUserCourse);


// CRUD operations
router.post('/', coursesController.createCourse);
router.put('/:courseId', coursesController.updateCourse);
router.delete('/:courseId', coursesController.deleteCourse);

module.exports = router;
