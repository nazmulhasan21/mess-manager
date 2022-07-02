const router = require('express').Router();

// require middleware
const isAuth = require('../middleware/is-auth');
const isAdmin = require('../middleware/is-admin');
const isMessId = require('../middleware/is-messId');

// require controllers
const monthController = require('../controllers/month');

// create routers
//// ******month *****
router.post('/', isAuth, isAdmin, monthController.createMonth);
router.get('/', isAuth, isMessId, monthController.getMonth);
router.get('/old', isAuth, isMessId, monthController.getOldMonth);
router.get('/all', isAuth, isMessId, monthController.getAllMonth);
router.put('/manager', isAuth, isAdmin, monthController.changeManager);
// month ******

// money *****
router.post('/memberMoney', isAuth, isAdmin, monthController.addMemberMoney);
router.get('/memberMoney', isAuth, isMessId, monthController.listMemberMoney);
router.get(
  '/memberMoney/:id',
  isAuth,
  isMessId,
  monthController.getMemberMoney
);
router.put(
  '/memberMoney/:monthId/:id',
  isAuth,
  isAdmin,
  monthController.updateMemberMoney
);
router.delete(
  '/memberMoney/:monthId/:id',
  isAuth,
  isAdmin,
  monthController.deleteMemberMoney
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
router.get('/memberRich/:id', isAuth, isMessId, monthController.getMemberRich);
router.get('/memberRich', isAuth, isMessId, monthController.getMemberRichList);

// Cost
router.post('/marketCost', isAuth, isAdmin, monthController.addMarketCost);
router.get('/marketCost', isAuth, isMessId, monthController.getMarketCostList);
router.get('/marketCost/:id', isAuth, isMessId, monthController.getCost);

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

// meal

router.post('/dailyMeal', isAuth, isAdmin, monthController.addDailyBorderMeal);

router.get('/meallist', isAuth, isMessId, monthController.mealList);
router.put('/dailyMeal/:id', isAuth, isAdmin, monthController.updateDailyMeal);
router.get('/dailyMeal/:id', isAuth, isMessId, monthController.getDailyMeal);

router.get('/monthCalculation', monthController.getMonthCalculation);

router.get('/test', isAuth, isAdmin, monthController.test);

module.exports = router;
