const pool = require("../database");
const { NotFoundError, DatabaseError } = require("../middlewares/errorTypes");

// Get all tee times
const getTeeTimes = async (req, res, next) => {
  try {
    const query = `
        SELECT ts.*, 
          c.CourseName
        FROM tee_sheet ts
        LEFT JOIN courses c ON ts.CourseId = c.CourseId
        WHERE ts.TeeTime >= NOW()
        ORDER BY ts.TeeTime, ts.TeeSheetId
      `;
    const rows = await pool.query(query);
    res.json(rows);
  } catch (error) {
    next(new DatabaseError("Error getting tee times", error));
  }
};

// Get a specific tee time by ID
const getTeeTimeById = async (req, res, next) => {
  const teeSheetId = req.params.teeSheetId;
  try {
    const rows = await pool.query(
      "SELECT * FROM tee_sheet WHERE TeeSheetId = ?",
      [teeSheetId]
    );
    if (rows.length === 0) {
      throw new NotFoundError("Tee time not found");
    }
    res.json(rows[0]);
  } catch (error) {
    next(new DatabaseError("Error getting specific tee time", error));
  }
};

// Create a new tee time
const createTeeTime = async (req, res, next) => {
  const UserId = req.user.userId;
  const { CourseId, TeeTime, TotalSpots } = req.body;
  try {
    // Insert the tee time
    const teeTimeResult = await pool.query(
      "INSERT INTO tee_sheet (CourseId, UserId, TeeTime, TotalSpots, AvailableSpots, Status) VALUES (?, ?, ?, ?, ?, 'open')",
      [CourseId, UserId, TeeTime, TotalSpots, TotalSpots - 1] // Subtract 1 for the creator
    );

    const teeSheetId = teeTimeResult.insertId;

    // Add the creator as the first player
    await pool.query(
      "INSERT INTO tee_sheet_players (TeeSheetId, UserId, Status) VALUES (?, ?, 'confirmed')",
      [teeSheetId, UserId]
    );

    res.status(201).json({
      TeeSheetId: teeSheetId,
      CourseId,
      UserId,
      TeeTime,
      TotalSpots,
      AvailableSpots: TotalSpots - 1,
      Status: "open",
    });
  } catch (error) {
    next(new DatabaseError("Error creating tee time", error));
  }
};

// Update a tee time
const updateTeeTime = async (req, res, next) => {
  const teeSheetId = req.params.teeSheetId;
  const { CourseId, TeeTime, TotalSpots } = req.body;
  try {
    const result = await pool.query(
      "UPDATE tee_sheet SET CourseId = ?, TeeTime = ?, TotalSpots = ? WHERE TeeSheetId = ?",
      [CourseId, TeeTime, TotalSpots, teeSheetId]
    );
    if (result.affectedRows === 0) {
      throw new NotFoundError("Tee time not found");
    } else {
      await updateAvailableSpots(teeSheetId);
      res.json({ TeeSheetId: teeSheetId, ...req.body });
    }
  } catch (error) {
    next(new DatabaseError("Error updating tee time", error));
  }
};

// Delete a tee time
const deleteTeeTime = async (req, res, next) => {
  const teeSheetId = req.params.teeSheetId;
  try {
    const result = await pool.query(
      "DELETE FROM tee_sheet WHERE TeeSheetId = ?",
      [teeSheetId]
    );
    if (result.affectedRows === 0) {
      throw new NotFoundError("Tee time not found");
    } else {
      res.sendStatus(204); // No Content
    }
  } catch (error) {
    next(new DatabaseError("Error deleting tee time", error));
  }
};

const getDetailedTeeTimes = async (req, res, next) => {
  try {
    const query = `
        SELECT ts.*, 
          c.CourseName,
          COALESCE(u.Name, tp.GuestName) AS PlayerName, 
          IFNULL(u.UserId, 'Guest') AS PlayerId,
          tp.Status AS PlayerStatus
        FROM tee_sheet ts
        LEFT JOIN courses c ON ts.CourseId = c.CourseId
        LEFT JOIN tee_sheet_players tp ON ts.TeeSheetId = tp.TeeSheetId AND tp.Status = 'confirmed'
        LEFT JOIN users u ON tp.UserId = u.UserId
        WHERE ts.TeeTime >= NOW()
        ORDER BY ts.TeeTime, tp.TeeSheetPlayerId
      `;
    const rows = await pool.query(query);
    const formattedRows = formatTeeSheetRows(rows); // Function to format rows into the desired structure
    res.json(formattedRows);
  } catch (error) {
    next(new DatabaseError("Error getting detailed tee times", error));
  }
};

function formatTeeSheetRows(rows) {
  // Group rows by TeeSheetId
  const groupedRows = rows.reduce((acc, row) => {
    if (!acc[row.TeeSheetId]) {
      acc[row.TeeSheetId] = {
        TeeSheetId: row.TeeSheetId,
        CourseId: row.CourseId,
        CourseName: row.CourseName,
        UserId: row.UserId,
        TeeTime: row.TeeTime,
        TotalSpots: row.TotalSpots,
        AvailableSpots: row.AvailableSpots,
        Status: row.Status,
        Players: [],
      };
    }
    acc[row.TeeSheetId].Players.push({
      PlayerName: row.PlayerName,
      PlayerStatus: row.PlayerStatus,
      PlayerId: row.PlayerId,
    });
    return acc;
  }, {});

  // Ensure each group has exactly four players
  //   Object.values(groupedRows).forEach((group) => {
  //     while (group.Players.length < 4) {
  //       group.Players.push({ PlayerName: null, Status: null, PlayerId: null });
  //     }
  //   });

  // Get the values from the groupedRows object and sort them by TeeTime
  return Object.values(groupedRows).sort((a, b) => {
    // Assuming TeeTime is in a format that can be compared directly (e.g., a string in ISO format or a Date object)
    return new Date(a.TeeTime) - new Date(b.TeeTime);
  });
}

const getTeeTimePlayers = async (req, res, next) => {
  const teeSheetId = req.params.teeSheetId;

  try {
    const query = `
        SELECT tp.TeeSheetPlayerId, tp.TeeSheetId, tp.UserId, IF(tp.UserId IS NOT NULL, u.Name, tp.GuestName) AS PlayerName, tp.Status, tp.UpdatedAt, 0 AS QueueId
        FROM tee_sheet_players tp 
        LEFT JOIN users u ON tp.UserId = u.UserId 
        WHERE tp.TeeSheetId = ?
        
        UNION
        
        SELECT 0, q.TeeSheetId, q.UserId, u.Name, q.Status, q.UpdatedAt, q.QueueId
        FROM tee_sheet_notification_queue q
        JOIN users u ON q.UserId = u.UserId
        WHERE q.TeeSheetId = ? AND q.Status = 'notified'
      `;
    const players = await pool.query(query, [teeSheetId, teeSheetId]);

    // Add empty slots based on total spots available for the tee time
    const teeTime = await pool.query(
      "SELECT TotalSpots FROM tee_sheet WHERE TeeSheetId = ?",
      [teeSheetId]
    );
    const totalSpots = teeTime[0].TotalSpots;
    while (players.length < totalSpots) {
      players.push({ PlayerName: "Empty Slot" });
    }

    res.json(players);
  } catch (error) {
    next(new DatabaseError("Error getting tee time players", error));
  }
};

const addGuestPlayer = async (req, res, next) => {
  const { teeSheetId, guestName } = req.body;

  try {
    await pool.query(
      "INSERT INTO tee_sheet_players (TeeSheetId, GuestName, Status) VALUES (?, ?, 'confirmed')",
      [teeSheetId, guestName]
    );

    await updateAvailableSpots(teeSheetId);

    res.status(201).json({ message: "Guest player added successfully." });
  } catch (error) {
    next(new DatabaseError("Error adding guest player", error));
  }
};

const addFriendPlayer = async (req, res, next) => {
  const { teeSheetId, userId } = req.body;

  try {
    await pool.query(
      "INSERT INTO tee_sheet_players (TeeSheetId, UserId, Status) VALUES (?, ?, 'confirmed')",
      [teeSheetId, userId]
    );

    await updateAvailableSpots(teeSheetId);

    res.status(201).json({ message: "Guest player added successfully." });
  } catch (error) {
    next(new DatabaseError("Error adding guest player", error));
  }
};

const removeTeeSheetPlayer = async (req, res, next) => {
  const { teeSheetPlayerId } = req.params;

  try {
    // Retrieve the teeSheetId for the player
    const playerResult = await pool.query(
      "SELECT TeeSheetId FROM tee_sheet_players WHERE TeeSheetPlayerId = ?",
      [teeSheetPlayerId]
    );

    if (playerResult.length === 0) {
      throw new NotFoundError("Player not found");
    }

    const teeSheetId = playerResult[0].TeeSheetId;

    // Delete the player
    const deleteResult = await pool.query(
      "DELETE FROM tee_sheet_players WHERE TeeSheetPlayerId = ?",
      [teeSheetPlayerId]
    );

    if (deleteResult.affectedRows === 0) {
      throw new NotFoundError("Player not found");
    } else {
      // Update available spots for the tee sheet
      await updateAvailableSpots(teeSheetId);
      res.sendStatus(204); // No Content
    }
  } catch (error) {
    next(new DatabaseError("Error removing player", error));
  }
};

const updateAvailableSpots = async (teeSheetId) => {
  try {
    // Step 1: Count the number of confirmed players
    const playersResult = await pool.query(
      "SELECT COUNT(*) AS confirmedCount FROM tee_sheet_players WHERE TeeSheetId = ? AND Status = 'confirmed'",
      [teeSheetId]
    );
    const confirmedCount = playersResult[0].confirmedCount;

    // Step 2: Optionally, retrieve total spots (if it's not a fixed number)
    const teeSheetResult = await pool.query(
      "SELECT TotalSpots FROM tee_sheet WHERE TeeSheetId = ?",
      [teeSheetId]
    );
    const totalSpots = teeSheetResult[0].TotalSpots;

    // Step 3: Calculate available spots
    const availableSpots = totalSpots - confirmedCount;

    // Step 4: Update the tee_sheet table
    await pool.query(
      "UPDATE tee_sheet SET AvailableSpots = ? WHERE TeeSheetId = ?",
      [availableSpots, teeSheetId]
    );
  } catch (error) {
    throw new DatabaseError("Error updating available spots", error);
  }
};

const addFriendsToNotificationQueue = async (req, res, next) => {
  const { teeSheetId, friends } = req.body;

  try {
    // Start by deleting all pending users for the specified tee sheet
    await pool.query(
      "DELETE FROM tee_sheet_notification_queue WHERE TeeSheetId = ? AND Status = 'pending'",
      [teeSheetId]
    );

    // Find the highest queue position
    const [{ maxQueuePosition }] = await pool.query(
      "SELECT MAX(QueuePosition) AS maxQueuePosition FROM tee_sheet_notification_queue WHERE TeeSheetId = ?",
      [teeSheetId]
    );

    let nextQueuePosition = maxQueuePosition ? maxQueuePosition + 1 : 1;

    // Add friends to the notification queue
    for (const friend of friends) {
      // Check if the friend is already in the queue with any status
      const existingEntry = await pool.query(
        "SELECT * FROM tee_sheet_notification_queue WHERE TeeSheetId = ? AND UserId = ?",
        [teeSheetId, friend.FriendUserId]
      );

      if (existingEntry.length === 0) {
        // Friend not in the queue, add them with 'pending' status
        await pool.query(
          "INSERT INTO tee_sheet_notification_queue (TeeSheetId, UserId, QueuePosition, Status) VALUES (?, ?, ?, 'pending')",
          [teeSheetId, friend.FriendUserId, nextQueuePosition]
        );
        nextQueuePosition++; // Increment for the next friend
      }
    }

    // Call notifyNextUserInQueue function
    const notifyResult = await notifyNextUserInQueue(teeSheetId);
    if (notifyResult.success) {
      res
        .status(201)
        .json({ message: "Notification queue updated and users notified." });
    } else {
      res
        .status(201)
        .json({
          message: "Notification queue updated but users not notified.",
        });
    }
  } catch (error) {
    next(new DatabaseError("Error updating notification queue", error));
  }
};

const notifyNextUserInQueue = async (teeSheetId) => {
  try {
    // Fetch the number of available spots
    const [{ AvailableSpots }] = await pool.query(
      "SELECT AvailableSpots FROM tee_sheet WHERE TeeSheetId = ?",
      [teeSheetId]
    );
    console.log(AvailableSpots);
    // Fetch the number of already notified users
    const [{ notifiedCount }] = await pool.query(
      "SELECT COUNT(*) AS notifiedCount FROM tee_sheet_notification_queue WHERE TeeSheetId = ? AND Status = 'notified'",
      [teeSheetId]
    );

    console.log(notifiedCount);

    // Calculate the number of spots left to notify
    const spotsLeftToNotify = AvailableSpots - notifiedCount;

    for (let i = 0; i < spotsLeftToNotify; i++) {
      // Find the next user in the queue with the lowest queue position and 'pending' status
      const nextUser = await pool.query(
        "SELECT * FROM tee_sheet_notification_queue WHERE TeeSheetId = ? AND Status = 'pending' ORDER BY QueuePosition ASC LIMIT 1",
        [teeSheetId]
      );

      console.log("next user", nextUser);

      if (nextUser.length > 0) {
        const userId = nextUser[0].UserId;

        // Perform the notification action for the user
        await sendNotificationToUser(userId);

        // Optionally, update the status of the user in the queue to 'notified' or similar
        await pool.query(
          "UPDATE tee_sheet_notification_queue SET Status = 'notified' WHERE TeeSheetId = ? AND UserId = ?",
          [teeSheetId, userId]
        );
      } else {
        break; // No more pending users in the queue
      }
    }

    return { success: true, message: "Users in queue notified successfully." };
  } catch (error) {
    throw error;
  }
};

const updateQueueStatus = async (req, res, next) => {
    const { teeSheetId, userId, status } = req.body;  // Status should be 'accepted' or 'declined'
  
    try {
      // Update the status in the tee_sheet_notification_queue
      const result = await pool.query(
        "UPDATE tee_sheet_notification_queue SET Status = ? WHERE TeeSheetId = ? AND UserId = ?",
        [status, teeSheetId, userId]
      );
  
      if (result.affectedRows === 0) {
        throw new NotFoundError("Queue entry not found");
      }
  
      // If the status is 'declined', call notifyNextUserInQueue
      if (status === 'declined') {
        await notifyNextUserInQueue(teeSheetId);  // Implement this function based on your application logic
      } else if (status == 'accepted') {
        // Remove user from the queue
        await pool.query(
            "DELETE FROM tee_sheet_notification_queue WHERE TeeSheetId = ? AND UserId = ?",
            [teeSheetId, userId]
        );

        // Add user to the tee_sheet_players table
        await pool.query(
            "INSERT INTO tee_sheet_players (TeeSheetId, UserId, Status) VALUES (?, ?, 'confirmed')",
            [teeSheetId, userId]
        );

        await updateAvailableSpots(teeSheetId);
      }
  
      res.json({ message: `Queue status updated to ${status} successfully.` });
    } catch (error) {
      next(new DatabaseError(`Error updating queue status: ${error.message}`, error));
    }
  };

async function sendNotificationToUser(userId) {
  // Implement the logic to send a notification to the user
  // This could be an email, SMS, push notification, etc., depending on your application's capabilities
  console.log(`Sending notification to user ${userId}`);
  // Add actual notification sending code here
}

module.exports = {
  getTeeTimes,
  getTeeTimeById,
  createTeeTime,
  updateTeeTime,
  deleteTeeTime,
  getDetailedTeeTimes,
  getTeeTimePlayers,
  addGuestPlayer,
  addFriendPlayer,
  removeTeeSheetPlayer,
  addFriendsToNotificationQueue,
  notifyNextUserInQueue,
  updateQueueStatus
};
