const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getUsers,
  getSingleUser,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorize('Engineer'), getUsers)
  .post(authorize('Engineer'), createUser);

router
  .route('/:id')
  .get(getSingleUser)
  .put(authorize('Engineer'), updateUser)
  .delete(authorize('Engineer'), deleteUser);

module.exports = router;