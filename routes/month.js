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

// money

router.post('/memberMoney', isAuth, isAdmin, monthController.addMemberMoney);
router.get('/memberMoney/list', isAuth, monthController.listMemberMoney);
router.get('/memberMoney/:userId/:id', isAuth, monthController.getMemberMoney);
router.put(
  '/memberMoney/:userId/:id',
  isAuth,
  isAdmin,
  monthController.updateMemberMoney
);

// rich //
router.post('/memberRich', isAuth, isAdmin, monthController.addMemberRich);
router.put(
  '/memberRich/:monthId/:id',
  isAuth,
  isAdmin,
  monthController.updateMemberRich
);
router.delete(
  '/memberRich/:monthId/:id',
  isAuth,
  isAdmin,
  monthController.deleteMemberRich
);
router.get('/memberRich/:monthId/:id', isAuth, monthController.getMemberRich);
router.get('/memberRich', isAuth, monthController.getMemberRichList);

// Cost
router.get('/marketCost', isAuth, monthController.getMarketCostList);
router.get('/marketCost/:id', isAuth, monthController.getCost);
router.post('/marketCost', isAuth, isAdmin, monthController.addMarketCost);
router.put(
  '/marketCost/:monthId/:id',
  isAuth,
  isAdmin,
  monthController.updateMarketCost
);
router.delete(
  '/marketCost/:id',
  isAuth,
  isAdmin,
  monthController.deleteMarketCost
);
// cost end

router.post('/dailyMeal', isAuth, isAdmin, monthController.addDailyBorderMeal);

router.get('/meallist', isAuth, monthController.mealList);
router.put('/dailyMeal/:id', isAuth, isAdmin, monthController.updateDailyMeal);
router.get('/dailyMeal/:id', isAuth, isAdmin, monthController.getDailyMeal);

router.get('/monthCalculation', monthController.getMonthCalculation);

router.get('/test', isAuth, isAdmin, monthController.test);

module.exports = router;
