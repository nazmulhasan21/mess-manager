const data = require('./date.json');

const fixedMeal = 56;

let meal = 0;

data.allMember.forEach((member) => {
  meal += member.totalMeal > fixedMeal ? member.totalMeal : fixedMeal;
});

console.log(meal);
