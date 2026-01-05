// backend/utils/dbHelper.js
export const prepareQueryParams = (params) => {
  return params.map(param => {
    if (param === undefined) {
      return null;
    }
    if (typeof param === 'object' && param !== null && !(param instanceof Date)) {
      return JSON.stringify(param);
    }
    return param;
  });
};

// Usage in your friend notification code:
import { prepareQueryParams } from '../utils/dbHelper.js';

async function notifyFriendsOfActivity(userId, activityData) {
  const query = `
    INSERT INTO friend_activities (user_id, friend_id, activity_type, activity_data, created_at)
    SELECT ?, friends.friend_id, ?, ?, NOW()
    FROM friends 
    WHERE friends.user_id = ? AND friends.status = 'accepted'
  `;

  const params = prepareQueryParams([
    userId,
    activityData.type,
    activityData.data,
    userId
  ]);

  try {
    await db.execute(query, params);
  } catch (error) {
    console.error('Database execute error:', error);
    throw error;
  }
}