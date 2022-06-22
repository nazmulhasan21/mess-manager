const router = require('express').Router();

// require middleware
const isAuth = require('../middleware/is-auth');

// require controllers
const messController = require('../controllers/mess');
const isAdmin = require('../middleware/is-admin');

// create routers
router.post('/', isAuth, messController.createMess);
router.get('/', isAuth, messController.getMess);
router.put('/member', isAuth, isAdmin, messController.addMember);
router.get('/member', isAuth, messController.allMember);
router.delete('/member', isAuth, isAdmin, messController.deleteMember);

module.exports = router;
