// EXERCISE DATABASE - 150+ exercises with accurate MET values
// Calories = MET × weight(kg) × duration(hours)
export const EXERCISE_DATABASE = [

  // ─── RUNNING ─────────────────────────────────────────────
  { name: 'Running (slow, 5mph)', category: 'cardio', met: 8.3, icon: '🏃', description: '~8 min/km' },
  { name: 'Running (moderate, 6mph)', category: 'cardio', met: 9.8, icon: '🏃', description: '~6.5 min/km' },
  { name: 'Running (fast, 7.5mph)', category: 'cardio', met: 11.0, icon: '🏃', description: '~5 min/km' },
  { name: 'Running (very fast, 10mph)', category: 'cardio', met: 14.5, icon: '🏃', description: '~4 min/km' },
  { name: 'Jogging (easy)', category: 'cardio', met: 7.0, icon: '🏃', description: 'Light jog' },
  { name: 'Sprinting', category: 'cardio', met: 16.0, icon: '🏃', description: 'Max effort' },
  { name: 'Treadmill Running', category: 'cardio', met: 9.0, icon: '🏃', description: 'Treadmill' },
  { name: 'Trail Running', category: 'cardio', met: 10.5, icon: '🏃', description: 'Outdoor trails' },
  { name: 'Running (uphill)', category: 'cardio', met: 12.0, icon: '🏃', description: 'Incline run' },

  // ─── WALKING ─────────────────────────────────────────────
  { name: 'Walking (slow)', category: 'cardio', met: 2.5, icon: '🚶', description: '<3 km/h' },
  { name: 'Walking (moderate)', category: 'cardio', met: 3.5, icon: '🚶', description: '~4 km/h' },
  { name: 'Walking (brisk)', category: 'cardio', met: 4.3, icon: '🚶', description: '~6 km/h' },
  { name: 'Walking (uphill)', category: 'cardio', met: 6.0, icon: '🚶', description: 'Incline walk' },
  { name: 'Power Walking', category: 'cardio', met: 5.0, icon: '🚶', description: 'Fast-paced' },
  { name: 'Nordic Walking', category: 'cardio', met: 5.5, icon: '🚶', description: 'With poles' },

  // ─── CYCLING ─────────────────────────────────────────────
  { name: 'Cycling (leisure, <10mph)', category: 'cardio', met: 4.0, icon: '🚴', description: 'Easy ride' },
  { name: 'Cycling (moderate, 12-14mph)', category: 'cardio', met: 8.0, icon: '🚴', description: 'Moderate effort' },
  { name: 'Cycling (vigorous, 16-19mph)', category: 'cardio', met: 10.0, icon: '🚴', description: 'Hard effort' },
  { name: 'Cycling (racing, 20+mph)', category: 'cardio', met: 14.0, icon: '🚴', description: 'Racing pace' },
  { name: 'Cycling (uphill)', category: 'cardio', met: 12.0, icon: '🚴', description: 'Hill climb' },
  { name: 'Stationary Bike (easy)', category: 'cardio', met: 3.5, icon: '🚴', description: 'Light effort' },
  { name: 'Stationary Bike (moderate)', category: 'cardio', met: 5.5, icon: '🚴', description: 'Moderate' },
  { name: 'Stationary Bike (vigorous)', category: 'cardio', met: 8.8, icon: '🚴', description: 'Hard effort' },
  { name: 'Spin Class', category: 'cardio', met: 8.5, icon: '🚴', description: 'Spinning class' },

  // ─── SWIMMING ────────────────────────────────────────────
  { name: 'Swimming (leisure)', category: 'cardio', met: 6.0, icon: '🏊', description: 'Casual swim' },
  { name: 'Swimming (laps, moderate)', category: 'cardio', met: 7.0, icon: '🏊', description: 'Freestyle laps' },
  { name: 'Swimming (laps, vigorous)', category: 'cardio', met: 10.0, icon: '🏊', description: 'Fast laps' },
  { name: 'Backstroke', category: 'cardio', met: 7.0, icon: '🏊', description: 'Back swimming' },
  { name: 'Breaststroke', category: 'cardio', met: 10.3, icon: '🏊', description: 'Breaststroke' },
  { name: 'Butterfly Stroke', category: 'cardio', met: 13.8, icon: '🏊', description: 'Butterfly' },
  { name: 'Water Aerobics', category: 'cardio', met: 5.3, icon: '🏊', description: 'Aqua aerobics' },

  // ─── HIIT & CIRCUIT ──────────────────────────────────────
  { name: 'HIIT (moderate)', category: 'hiit', met: 8.0, icon: '🔥', description: '30s on/30s off' },
  { name: 'HIIT (vigorous)', category: 'hiit', met: 10.0, icon: '🔥', description: '40s on/20s off' },
  { name: 'Tabata', category: 'hiit', met: 8.0, icon: '🔥', description: '20s on/10s off x8' },
  { name: 'CrossFit', category: 'hiit', met: 9.0, icon: '🔥', description: 'WOD' },
  { name: 'Circuit Training', category: 'hiit', met: 8.0, icon: '🔄', description: 'Station rotations' },
  { name: 'Bootcamp', category: 'hiit', met: 8.5, icon: '🔥', description: 'Military style' },
  { name: 'Insanity Workout', category: 'hiit', met: 10.0, icon: '🔥', description: 'Max interval' },
  { name: 'Jump Rope (moderate)', category: 'hiit', met: 10.0, icon: '⚡', description: '~120 jumps/min' },
  { name: 'Jump Rope (fast)', category: 'hiit', met: 12.3, icon: '⚡', description: '~160 jumps/min' },
  { name: 'Double Unders', category: 'hiit', met: 13.0, icon: '⚡', description: 'Double jump rope' },
  { name: 'Burpees', category: 'hiit', met: 8.0, icon: '🔥', description: 'Full body' },
  { name: 'Mountain Climbers', category: 'hiit', met: 7.0, icon: '🔥', description: 'Core + cardio' },
  { name: 'Box Jumps', category: 'hiit', met: 7.5, icon: '🔥', description: 'Plyometric' },

  // ─── STRENGTH TRAINING ───────────────────────────────────
  { name: 'Weight Training (general)', category: 'strength', met: 3.5, icon: '🏋️', description: 'Mixed weights' },
  { name: 'Weight Training (vigorous)', category: 'strength', met: 6.0, icon: '🏋️', description: 'Heavy lifting' },
  { name: 'Bench Press', category: 'strength', met: 3.8, icon: '🏋️', description: 'Chest exercise' },
  { name: 'Squat (barbell)', category: 'strength', met: 5.0, icon: '🏋️', description: 'Compound leg' },
  { name: 'Deadlift', category: 'strength', met: 6.0, icon: '🏋️', description: 'Full body pull' },
  { name: 'Overhead Press', category: 'strength', met: 3.5, icon: '🏋️', description: 'Shoulder press' },
  { name: 'Barbell Row', category: 'strength', met: 4.0, icon: '🏋️', description: 'Back row' },
  { name: 'Pull Ups / Chin Ups', category: 'strength', met: 4.0, icon: '💪', description: 'Bodyweight pull' },
  { name: 'Push Ups', category: 'strength', met: 3.8, icon: '💪', description: 'Bodyweight push' },
  { name: 'Dips', category: 'strength', met: 3.8, icon: '💪', description: 'Tricep dips' },
  { name: 'Lunges', category: 'strength', met: 4.0, icon: '💪', description: 'Leg exercise' },
  { name: 'Dumbbell Bicep Curl', category: 'strength', met: 3.0, icon: '🏋️', description: 'Arm exercise' },
  { name: 'Tricep Extension', category: 'strength', met: 3.0, icon: '🏋️', description: 'Arm exercise' },
  { name: 'Lateral Raises', category: 'strength', met: 2.8, icon: '🏋️', description: 'Shoulder' },
  { name: 'Leg Press', category: 'strength', met: 4.0, icon: '🏋️', description: 'Machine leg' },
  { name: 'Leg Curl', category: 'strength', met: 3.5, icon: '🏋️', description: 'Hamstring' },
  { name: 'Calf Raises', category: 'strength', met: 2.8, icon: '🏋️', description: 'Calf muscles' },
  { name: 'Sit Ups', category: 'strength', met: 2.8, icon: '💪', description: 'Core abs' },
  { name: 'Crunches', category: 'strength', met: 2.8, icon: '💪', description: 'Ab exercise' },
  { name: 'Plank', category: 'strength', met: 3.0, icon: '💪', description: 'Core hold' },
  { name: 'Russian Twists', category: 'strength', met: 3.0, icon: '💪', description: 'Obliques' },
  { name: 'Dumbbell Training (general)', category: 'strength', met: 3.5, icon: '🏋️', description: 'Dumbbell work' },
  { name: 'Kettlebell Training', category: 'strength', met: 8.0, icon: '🏋️', description: 'Kettlebell' },
  { name: 'Kettlebell Swings', category: 'strength', met: 8.2, icon: '🏋️', description: 'Hip hinge' },
  { name: 'Powerlifting', category: 'strength', met: 6.0, icon: '🏋️', description: 'Max effort' },
  { name: 'Olympic Weightlifting', category: 'strength', met: 6.0, icon: '🏋️', description: 'Snatch/Clean' },
  { name: 'Resistance Bands', category: 'strength', met: 3.0, icon: '💪', description: 'Band training' },
  { name: 'Cable Machine', category: 'strength', met: 3.5, icon: '🏋️', description: 'Cable pulls' },
  { name: 'TRX / Suspension Training', category: 'strength', met: 4.5, icon: '💪', description: 'Suspension' },

  // ─── BODYWEIGHT ──────────────────────────────────────────
  { name: 'Bodyweight Workout', category: 'strength', met: 4.0, icon: '💪', description: 'General BWF' },
  { name: 'Calisthenics', category: 'strength', met: 5.0, icon: '💪', description: 'Advanced BWF' },
  { name: 'Jump Squats', category: 'strength', met: 5.0, icon: '💪', description: 'Plyometric squat' },
  { name: 'Pike Push Ups', category: 'strength', met: 4.0, icon: '💪', description: 'Shoulder push' },

  // ─── YOGA & FLEXIBILITY ──────────────────────────────────
  { name: 'Yoga (hatha)', category: 'flexibility', met: 2.5, icon: '🧘', description: 'Gentle poses' },
  { name: 'Yoga (vinyasa / flow)', category: 'flexibility', met: 4.0, icon: '🧘', description: 'Flowing sequence' },
  { name: 'Yoga (power)', category: 'flexibility', met: 4.5, icon: '🧘', description: 'Intense yoga' },
  { name: 'Yoga (Ashtanga)', category: 'flexibility', met: 4.0, icon: '🧘', description: 'Traditional sequence' },
  { name: 'Yoga (Bikram / Hot)', category: 'flexibility', met: 4.0, icon: '🧘', description: 'Heated room' },
  { name: 'Stretching', category: 'flexibility', met: 2.3, icon: '🧘', description: 'Static stretches' },
  { name: 'Pilates', category: 'flexibility', met: 3.0, icon: '🧘', description: 'Core & control' },
  { name: 'Pilates (vigorous)', category: 'flexibility', met: 4.0, icon: '🧘', description: 'Advanced Pilates' },
  { name: 'Foam Rolling', category: 'flexibility', met: 2.0, icon: '🧘', description: 'Recovery' },
  { name: 'Mobility Training', category: 'flexibility', met: 2.5, icon: '🧘', description: 'Joint mobility' },
  { name: 'Surya Namaskar', category: 'flexibility', met: 3.8, icon: '🧘', description: '1 round = 12 poses' },
  { name: 'Pranayama', category: 'flexibility', met: 1.5, icon: '🧘', description: 'Breathing exercises' },

  // ─── SPORTS - CRICKET & REGIONAL ─────────────────────────
  { name: 'Cricket (batting)', category: 'sports', met: 5.0, icon: '🏏', description: 'Active batting' },
  { name: 'Cricket (fielding)', category: 'sports', met: 4.0, icon: '🏏', description: 'Fielding' },
  { name: 'Cricket (bowling)', category: 'sports', met: 5.5, icon: '🏏', description: 'Bowling spells' },
  { name: 'Cricket (general)', category: 'sports', met: 4.8, icon: '🏏', description: 'Full match' },
  { name: 'Kabaddi', category: 'sports', met: 7.0, icon: '🤼', description: 'High intensity' },
  { name: 'Kho Kho', category: 'sports', met: 6.5, icon: '🏃', description: 'Tag sport' },
  { name: 'Gilli Danda', category: 'sports', met: 4.0, icon: '🏏', description: 'Traditional game' },

  // ─── SPORTS - BALL SPORTS ────────────────────────────────
  { name: 'Football / Soccer', category: 'sports', met: 7.0, icon: '⚽', description: '90 min match' },
  { name: 'Basketball', category: 'sports', met: 6.5, icon: '🏀', description: 'Full court' },
  { name: 'Volleyball', category: 'sports', met: 4.0, icon: '🏐', description: 'Indoor/beach' },
  { name: 'Beach Volleyball', category: 'sports', met: 8.0, icon: '🏐', description: 'Sand court' },
  { name: 'Handball', category: 'sports', met: 8.0, icon: '🤾', description: 'Team handball' },
  { name: 'Rugby', category: 'sports', met: 8.3, icon: '🏉', description: 'Full contact' },
  { name: 'American Football', category: 'sports', met: 8.0, icon: '🏈', description: 'Practice/game' },
  { name: 'Baseball', category: 'sports', met: 5.0, icon: '⚾', description: 'Pitching/batting' },

  // ─── SPORTS - RACKET SPORTS ──────────────────────────────
  { name: 'Badminton (casual)', category: 'sports', met: 4.5, icon: '🏸', description: 'Recreational' },
  { name: 'Badminton (competitive)', category: 'sports', met: 7.0, icon: '🏸', description: 'Match play' },
  { name: 'Tennis (singles)', category: 'sports', met: 8.0, icon: '🎾', description: 'Competitive match' },
  { name: 'Tennis (doubles)', category: 'sports', met: 5.0, icon: '🎾', description: 'Doubles game' },
  { name: 'Table Tennis (casual)', category: 'sports', met: 3.0, icon: '🏓', description: 'Recreational' },
  { name: 'Table Tennis (competitive)', category: 'sports', met: 5.0, icon: '🏓', description: 'Tournament' },
  { name: 'Squash', category: 'sports', met: 12.0, icon: '🎾', description: 'Very high intensity' },
  { name: 'Pickleball', category: 'sports', met: 4.0, icon: '🎾', description: 'Casual game' },

  // ─── SPORTS - MARTIAL ARTS ───────────────────────────────
  { name: 'Boxing (bag work)', category: 'sports', met: 6.0, icon: '🥊', description: 'Heavy bag' },
  { name: 'Boxing (sparring)', category: 'sports', met: 9.0, icon: '🥊', description: 'Contact sparring' },
  { name: 'Boxing (shadow)', category: 'sports', met: 7.0, icon: '🥊', description: 'Shadow boxing' },
  { name: 'MMA Training', category: 'sports', met: 9.5, icon: '🥋', description: 'Mixed martial arts' },
  { name: 'Karate / Taekwondo', category: 'sports', met: 8.0, icon: '🥋', description: 'Martial arts' },
  { name: 'Judo / Wrestling', category: 'sports', met: 8.0, icon: '🤼', description: 'Grappling' },
  { name: 'Muay Thai', category: 'sports', met: 9.0, icon: '🥊', description: 'Thai boxing' },
  { name: 'Kickboxing', category: 'sports', met: 7.0, icon: '🥊', description: 'Cardio kickboxing' },

  // ─── SPORTS - WATER ──────────────────────────────────────
  { name: 'Surfing', category: 'sports', met: 3.0, icon: '🏄', description: 'Wave riding' },
  { name: 'Kayaking (moderate)', category: 'sports', met: 5.0, icon: '🚣', description: 'Paddling' },
  { name: 'Rowing (moderate)', category: 'cardio', met: 7.0, icon: '🚣', description: 'Machine/water' },
  { name: 'Rowing (vigorous)', category: 'cardio', met: 8.5, icon: '🚣', description: 'Hard effort' },
  { name: 'Rowing (racing)', category: 'cardio', met: 12.0, icon: '🚣', description: 'Max effort' },

  // ─── OUTDOOR / ADVENTURE ─────────────────────────────────
  { name: 'Hiking (easy trail)', category: 'sports', met: 5.3, icon: '⛰️', description: 'Flat terrain' },
  { name: 'Hiking (moderate)', category: 'sports', met: 6.0, icon: '⛰️', description: 'Mixed terrain' },
  { name: 'Hiking (steep)', category: 'sports', met: 8.0, icon: '⛰️', description: 'Steep incline' },
  { name: 'Rock Climbing (indoor)', category: 'sports', met: 7.5, icon: '🧗', description: 'Bouldering/walls' },
  { name: 'Rock Climbing (outdoor)', category: 'sports', met: 8.0, icon: '🧗', description: 'Natural rock' },
  { name: 'Skateboarding', category: 'sports', met: 5.0, icon: '🛹', description: 'Street/park' },
  { name: 'Rollerblading', category: 'sports', met: 7.0, icon: '⛸️', description: 'Inline skating' },
  { name: 'Skiing (downhill)', category: 'sports', met: 6.8, icon: '⛷️', description: 'Alpine skiing' },

  // ─── DANCE & AEROBICS ────────────────────────────────────
  { name: 'Zumba', category: 'cardio', met: 6.5, icon: '💃', description: 'Dance fitness' },
  { name: 'Aerobics (low impact)', category: 'cardio', met: 5.0, icon: '💃', description: 'Easy aerobics' },
  { name: 'Aerobics (high impact)', category: 'cardio', met: 7.0, icon: '💃', description: 'Intense aerobics' },
  { name: 'Cardio Dance', category: 'cardio', met: 6.0, icon: '💃', description: 'Dance cardio' },
  { name: 'Bollywood Dance', category: 'cardio', met: 6.0, icon: '💃', description: 'Hindi film dance' },
  { name: 'Classical Dance (Bharatanatyam)', category: 'cardio', met: 4.5, icon: '💃', description: 'Classical form' },
  { name: 'Hip Hop Dance', category: 'cardio', met: 7.0, icon: '💃', description: 'Street dance' },

  // ─── CARDIO MACHINES ─────────────────────────────────────
  { name: 'Elliptical (light)', category: 'cardio', met: 4.0, icon: '🔄', description: 'Easy effort' },
  { name: 'Elliptical (moderate)', category: 'cardio', met: 5.0, icon: '🔄', description: 'Moderate effort' },
  { name: 'Elliptical (vigorous)', category: 'cardio', met: 6.5, icon: '🔄', description: 'Hard effort' },
  { name: 'Stair Climbing (machine)', category: 'cardio', met: 8.8, icon: '🪜', description: 'StairMaster' },
  { name: 'Stair Climbing (actual)', category: 'cardio', met: 8.0, icon: '🪜', description: 'Building stairs' },
  { name: 'Battle Ropes', category: 'hiit', met: 9.0, icon: '🔥', description: 'Rope slams' },
  { name: 'Assault Bike', category: 'hiit', met: 10.0, icon: '🚴', description: 'Air bike' },
  { name: 'Ski Erg', category: 'cardio', met: 8.0, icon: '⛷️', description: 'Ski machine' },

  // ─── SPORTS - HOCKEY / FIELD ─────────────────────────────
  { name: 'Field Hockey', category: 'sports', met: 7.5, icon: '🏑', description: 'Field hockey' },
  { name: 'Ice Hockey', category: 'sports', met: 8.0, icon: '🏒', description: 'Ice skating + puck' },
  { name: 'Polo', category: 'sports', met: 6.0, icon: '🐎', description: 'Horse polo' },
];
