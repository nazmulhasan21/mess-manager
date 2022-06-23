const router = require('express').Router();

// require middleware
const isAuth = require('../middleware/is-auth');
const isAdmin = require('../middleware/is-admin');

// require controllers
const monthController = require('../controllers/month');

// create routers
router.post('/', isAuth, isAdmin, monthController.createMonth);
router.get('/', isAuth, monthController.getMonth);
router.get('/old', isAuth, monthController.getOldMonth);
router.get('/all', isAuth, monthController.getAllMonth);
router.put('/manager', isAuth, isAdmin, monthController.changeManager);
router.post('/addMemberMoney', isAuth, isAdmin, monthController.addMemberMoney);
router.post('/addMemberRich', isAuth, isAdmin, monthController.addMemberRich);
router.get('/marketCost', isAuth, monthController.getMarketCost);
router.get('/marketCost/:id', isAuth, monthController.getCost);
router.post('/marketCost', isAuth, isAdmin, monthController.addMarketCost);
router.put(
  '/marketCost/:id',
  isAuth,
  isAdmin,
  monthController.updateMarketCost
);

router.post('/dailyMeal', isAuth, monthController.addDailyBorderMeal);

module.exports = router;
