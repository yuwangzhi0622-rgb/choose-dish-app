INSERT INTO `Chef` (`id`, `name`, `createdAt`)
VALUES
  ('chef_yu', '余老师', NOW()),
  ('chef_du', '杜老师', NOW()),
  ('chef_33', '33老师', NOW()),
  ('chef_tianbian', '天边老师', NOW()),
  ('chef_nainai', '奶奶', NOW()),
  ('chef_shitang', '食堂', NOW()),
  ('chef_wanghong', '网红探店', NOW())
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `createdAt` = `createdAt`;

UPDATE `MealRecord` AS meal
INNER JOIN `Chef` AS chef
  ON chef.`name` = meal.`chef`
SET meal.`chefId` = chef.`id`
WHERE meal.`chef` IS NOT NULL
  AND (meal.`chefId` IS NULL OR meal.`chefId` = '');
