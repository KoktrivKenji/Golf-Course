const { TeeTime } = require('../models');

async function seedTeeTimes() {
  const courses = ['Pine Valley', 'Augusta National', 'St Andrews', 'Pebble Beach'];
  const holes = ['9H', '18H'];
  const times = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00'];
  
  const today = new Date();
  const teeTimes = [];

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    courses.forEach(course => {
      holes.forEach(hole => {
        times.forEach(time => {
          teeTimes.push({
            course,
            holes: hole,
            date: date,
            time: time,
            available: true
          });
        });
      });
    });
  }

  await TeeTime.bulkCreate(teeTimes);
}

seedTeeTimes().then(() => {
  console.log('Tee times seeded successfully');
  process.exit();
});
