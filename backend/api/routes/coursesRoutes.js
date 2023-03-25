const express = require('express');
const coursesController = require('../controllers/coursesController');

const router = express.Router();

router.get('/', coursesController.getCourses);
router.get('/:courseId', coursesController.getCourseById);
router.post('/', coursesController.createCourse);
router.put('/:courseId', coursesController.updateCourse);
router.delete('/:courseId', coursesController.deleteCourse);

module.exports = router;