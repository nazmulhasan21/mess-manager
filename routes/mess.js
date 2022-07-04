const router = require('express').Router();

// require middleware
const isAuth = require('../middleware/is-auth');

// require controllers
const messController = require('../controllers/mess');
const isAdmin = require('../middleware/is-admin');
const isMessId = require('../middleware/is-messId');

// create routers
router.post('/', isAuth, messController.createMess);
router.get('/', isAuth, isMessId, messController.getMess);
router.post('/member', isAuth, isAdmin, messController.addMember);
router.get('/member', isAuth, isMessId, messController.allMember);
router.delete('/member', isAuth, isAdmin, messController.deleteMember);

module.exports = router;
