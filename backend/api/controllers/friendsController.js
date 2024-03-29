const pool = require("../database");
const { NotFoundError, DatabaseError } = require("../middlewares/errorTypes");

// Get all friends for the logged-in user
const getFriends = async (req, res, next) => {
  const userId = req.user.userId;
  const statusFilter = req.query.status ? req.query.status.split(',') : ['accepted', 'pending'];


  try {
    let query = `
      SELECT 
        f.*, 
        CASE 
          WHEN f.UserId1 = ? THEN u2.Name 
          ELSE u1.Name 
        END AS Name,
        CASE 
          WHEN f.UserId1 = ? THEN u2.UserId 
          ELSE u1.UserId
        END AS FriendUserId,
        CASE 
          WHEN f.UserId1 = ? THEN u2.Email 
          ELSE u1.Email 
        END AS Email
      FROM 
        friends f 
        LEFT JOIN users u1 ON f.UserId1 = u1.UserId 
        LEFT JOIN users u2 ON f.UserId2 = u2.UserId 
      WHERE 
        (f.UserId1 = ? OR f.UserId2 = ?)
    `;
    query += " AND f.Status IN (?) ";
    query += " ORDER BY f.Status ASC, Name ";

    const rows = await pool.query(query, [userId, userId, userId, userId, userId, statusFilter]);
    res.json(rows);
  } catch (error) {
    next(new DatabaseError("Error getting friends", error));
  }
};

// Create a new friend connection
const createFriend = async (req, res, next) => {
  const userId1 = req.user.userId;
  const { friendId } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO friends (UserId1, UserId2, Status) VALUES (?, ?, 'Pending')",
      [userId1, friendId]
    );

    await sendFriendRequestNotification(friendId, userId1);

    res
      .status(201)
      .json({
        FriendshipId: result.insertId,
        UserId1: userId1,
        UserId2: friendId,
        Status: "Pending",
      });
  } catch (error) {
    next(new DatabaseError("Error creating friend request", error));
  }
};

async function sendFriendRequestNotification(recipientUserId, senderUserId) {
  // Logic to send a notification
  // This could involve looking up the recipient's contact details in the database
  // and sending an email, push notification, or some other form of message
  // For example:
  // const recipientDetails = await getUserDetails(recipientUserId);
  // sendEmailOrPushNotification(recipientDetails, `You have a new friend request from ${senderUserId}`);
  console.log("Friend request notification!");
}

// Update friend connection (e.g., accept a friend request)
const updateFriend = async (req, res, next) => {
  const userId = req.user.userId; // Logged-in user's ID
  const friendshipId = req.params.friendshipId;
  const { status } = req.body; // 'accepted' or 'declined'

  try {
    // Verify that the logged-in user is the recipient of the friend request
    const [friendRequest] = await pool.query(
      "SELECT * FROM friends WHERE FriendshipId = ? AND UserId2 = ? AND Status = 'pending'",
      [friendshipId, userId]
    );

    if (friendRequest.length === 0) {
      throw new NotFoundError(
        "Friend request not found or you are not authorized to accept it"
      );
    }

    // Update the status of the friendship
    const result = await pool.query(
      "UPDATE friends SET Status = ? WHERE FriendshipId = ?",
      [status, friendshipId]
    );

    res.json({ FriendshipId: friendshipId, Status: status });
  } catch (error) {
    next(error);
  }
};

// Delete a friend connection
const deleteFriend = async (req, res, next) => {
  const friendshipId = req.params.friendshipId;

  try {
    const result = await pool.query(
      "DELETE FROM friends WHERE FriendshipId = ?",
      [friendshipId]
    );
    if (result.affectedRows === 0) {
      throw new NotFoundError("Friendship not found");
    } else {
      res.sendStatus(204);
    }
  } catch (error) {
    next(new DatabaseError("Error deleting friendship", error));
  }
};

// Retrieve pending friend requests for the logged-in user
const getPendingRequests = async (req, res, next) => {
  const userId = req.user.userId;

  try {
    const rows = await pool.query(
      "SELECT f.*, u.Name, u.Email FROM friends f JOIN users u ON f.UserId2 = u.UserId WHERE (UserId1 = ? OR UserId2 = ?) AND Status = 'pending'",
      [userId, userId]
    );
    res.json(rows);
  } catch (error) {
    next(new DatabaseError("Error getting pending requests", error));
  }
};

module.exports = {
  getFriends,
  createFriend,
  updateFriend,
  deleteFriend,
  getPendingRequests,
};
