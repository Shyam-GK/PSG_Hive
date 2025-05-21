const {
  getLandingPageEvents: getLandingPageEventsModel,
  getAllUpcomingEvents: getAllUpcomingEventsModel,
  getAllEvents: getAllEventsModel,
  getClubEvents: getClubEventsModel,
  getClubName: getClubNameModel,
  addEvent: addEventModel,
} = require("../models/eventModel");

console.log("Imported eventModel:", {
  getLandingPageEventsModel,
  getAllUpcomingEventsModel,
  getAllEventsModel,
  getClubEventsModel,
  getClubNameModel,
  addEventModel,
});
console.log("eventModel module path:", require.resolve("../models/eventModel"));

const getLandingPageEvents = async (req, res) => {
  try {
    const events = await getLandingPageEventsModel();
    res.status(200).json(events);
  } catch (error) {
    console.error("Error in getLandingPageEvents:", error.message, error.stack);
    res.status(200).json(mockEvents);
  }
};

const getAllUpcomingEvents = async (req, res) => {
  try {
    const events = await getAllUpcomingEventsModel();
    res.status(200).json(events);
  } catch (error) {
    console.error("Error in getAllUpcomingEvents:", error.message, error.stack);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

const getAllEvents = async (req, res) => {
  try {
    const events = await getAllEventsModel();
    res.status(200).json(events);
  } catch (error) {
    console.error("Error in getAllEvents:", error.message, error.stack);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

const getClubEvents = async (req, res) => {
  console.log("Handling getClubEvents:", req.params);
  try {
    const { clubId } = req.params;
    if (!clubId || typeof clubId !== "string" || clubId.trim() === "") {
      return res.status(400).json({ error: "Invalid or missing club ID" });
    }
    const events = await getClubEventsModel(clubId);
    if (!events || events.length === 0) {
      return res.status(404).json({ error: "No events found for this club" });
    }
    res.status(200).json(events);
  } catch (error) {
    console.error("Error in getClubEvents:", error.message, error.stack);
    res
      .status(500)
      .json({ error: `Error fetching club events: ${error.message}` });
  }
};

const getClubName = async (req, res) => {
  console.log("Handling getClubName:", req.params);
  try {
    const { clubId } = req.params;
    if (!clubId || typeof clubId !== "string" || clubId.trim() === "") {
      return res.status(400).json({ error: "Invalid or missing club ID" });
    }
    const clubName = await getClubNameModel(clubId);
    if (!clubName) {
      return res.status(404).json({ error: "Club not found" });
    }
    res.status(200).json({ club_id: clubId, club_name: clubName });
  } catch (error) {
    console.error("Error in getClubName:", error.message, error.stack);
    res
      .status(500)
      .json({ error: `Error fetching club name: ${error.message}` });
  }
};

const addEvent = async (req, res) => {
  console.log("Handling addEvent:", req.body);
  try {
    const { club, start_datetime, end_datetime, event_name, event_desc } = req.body;
    if (!club || !start_datetime || !event_name) {
      return res.status(400).json({ error: "Missing required fields: club, start_datetime, event_name" });
    }
    const event = await addEventModel({
      club,
      start_datetime,
      end_datetime,
      event_name,
      event_desc,
    });
    res.status(201).json(event);
  } catch (error) {
    console.error("Error in addEvent:", error.message, error.stack);
    res.status(500).json({ error: `Error adding event: ${error.message}` });
  }
};

module.exports = {
  getLandingPageEvents,
  getAllUpcomingEvents,
  getAllEvents,
  getClubEvents,
  getClubName,
  addEvent,
};