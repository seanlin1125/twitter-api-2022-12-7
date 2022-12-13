const express = require('express')
const router = express.Router()
const passport = require('../config/passport')
const admin = require('./modules/admin')
const userController = require('../controllers/user-controller')
const replyController = require('../controllers/reply-controller')
const { authenticated, authenticatedAdmin, authenticatedUser } = require('../middleware/auth')

// 後台登入
router.post('/admin/signin', passport.authenticate('local', { session: false }), authenticatedAdmin, userController.signIn)
// 後台功能路由
router.use('/admin', authenticated, authenticatedAdmin, admin)
// 前台登入
router.post('/signin', passport.authenticate('local', { session: false }), authenticatedUser, userController.signIn)

// Reply CRUD
router.post('tweets/:id/replies', authenticated, authenticatedUser, replyController.postReply)
router.get('tweets/:id/replies', authenticated, authenticatedUser, replyController.getReplies)

router.use('/', (req, res) => {
  res.json('api test main')
})

module.exports = router
