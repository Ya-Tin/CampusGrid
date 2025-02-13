import React, { useState, useEffect, useContext } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";

const localizer = momentLocalizer(moment);

const Timetable = ({ branch, semester }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const { url, studentData } = useContext(StoreContext);

  const daysOfWeek = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const response1 = await axios.post(`${url}/api/student/timetable`, {
          branch: "ECE",
          semester: "3",
        });

        const response2 = await axios.post(`${url}/api/student/reschedules`, {
          branch: "ECE",
          semester: "3",
        });

        const { classes } = response1.data;
        const { rescheduled_classes } = response2.data;

        // Generate weekly recurring events for original timetable
        const originalEvents = [];
        for (let i = 0; i < 4; i++) {
          // Assuming the timetable repeats for 4 weeks
          const weekStart = moment().startOf("week").add(i, "weeks");
          classes.forEach((event) => {
            const dayIndex = daysOfWeek.indexOf(event.day_of_week);
            const startDate = weekStart
              .clone()
              .add(dayIndex, "days")
              .set({
                hour: parseInt(event.start_time.split(":")[0], 10),
                minute: parseInt(event.start_time.split(":")[1], 10),
              });

            const endDate = startDate
              .clone()
              .add(
                parseInt(event.end_time.split(":")[0], 10) -
                  parseInt(event.start_time.split(":")[0], 10),
                "hours"
              )
              .add(
                parseInt(event.end_time.split(":")[1], 10) -
                  parseInt(event.start_time.split(":")[1], 10),
                "minutes"
              );

            originalEvents.push({
              id: `${event.id}-${i}`,
              title: `${event.courses.course_name} - Lecture Hall ${event.lecture_halls.hall_name}`,
              start: startDate.toDate(),
              end: endDate.toDate(),
              details: {
                courseName: event.courses.course_name,
                branch: event.courses.branch,
                semester: event.courses.semester,
                courseCode: event.courses.course_code,
                lectureHall: event.lecture_halls.hall_name,
                dayOfWeek: event.day_of_week,
                startTime: event.start_time,
                endTime: event.end_time,
              },
            });
          });
        }

        // Format rescheduled events
        const rescheduledEvents = rescheduled_classes.map((event) => {
          const startDate = moment(event.rescheduled_date).set({
            hour: parseInt(event.new_time.split(":")[0], 10),
            minute: parseInt(event.new_time.split(":")[1], 10),
          });

          const endDate = moment(startDate).add(1, "hour"); // Assuming a fixed 1-hour duration for rescheduled classes

          return {
            id: `rescheduled-${event.id}`,
            title: `${event.courses.course_name} (Rescheduled) - Lecture Hall ${event.lecture_halls.hall_name}`,
            start: startDate.toDate(),
            end: endDate.toDate(),
            details: {
              courseName: event.courses.course_name,
              branch: event.courses.branch,
              semester: event.courses.semester,
              courseCode: event.courses.course_code,
              lectureHall: event.lecture_halls.hall_name,
              originalDate: event.original_date,
              rescheduledDate: event.rescheduled_date,
              reason: event.reason,
              newTime: event.new_time,
            },
          };
        });

        // Remove overwritten events from originalEvents
        const filteredOriginalEvents = originalEvents.filter((event) => {
          return !rescheduled_classes.some((rescheduled) => {
            const originalDate = moment(rescheduled.original_date).toDate();
            return (
              event.start.toDateString() === originalDate.toDateString() &&
              event.title.includes(rescheduled.courses.course_name)
            );
          });
        });

        // Combine original and rescheduled events
        setEvents([...filteredOriginalEvents, ...rescheduledEvents]);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching timetable:", error);
        setError("Failed to fetch timetable.");
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [studentData.branch, studentData.semester, url]);

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const closeModal = () => {
    setSelectedEvent(null);
  };

  const eventStyleGetter = (event, start, end, isSelected) => ({
    style: {
      backgroundColor: isSelected ? "#1d4ed8" : "#3174ad",
      color: "white",
      borderRadius: "5px",
      padding: "4px",
      textAlign: "center",
      border: isSelected ? "2px solid #2563eb" : "none",
    },
  });

  const formats = {
    timeGutterFormat: (date, culture, localizer) =>
      localizer.format(date, "hh:mm A", culture),
    eventTimeRangeFormat: () => "",
    agendaTimeRangeFormat: () => "",
  };

  if (loading) return <div>Loading timetable...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="flex">
      {/* Main Content */}
      <div className="flex-1 p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Student Timetable</h2>
        </div>

        {/* Calendar */}
        <div className="bg-white shadow-md rounded-lg p-4">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            eventPropGetter={eventStyleGetter}
            views={["month", "week", "day", "agenda"]}
            defaultView="week"
            formats={formats}
            onSelectEvent={handleEventClick}
            min={new Date(2024, 11, 22, 8, 0)} // Set minimum time to 8 AM
            max={new Date(2024, 11, 22, 17, 0)} // Set maximum time to 5 PM
          />
        </div>
      </div>

      {/* Modal for Event Details */}
      {selectedEvent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h3 className="text-xl font-bold mb-4">Class Details</h3>
            <p>
              <strong>Course Name:</strong> {selectedEvent.details.courseName}
            </p>
            <p>
              <strong>Branch:</strong> {selectedEvent.details.branch}
            </p>
            <p>
              <strong>Semester:</strong> {selectedEvent.details.semester}
            </p>
            <p>
              <strong>Course Code:</strong> {selectedEvent.details.courseCode}
            </p>
            <p>
              <strong>Lecture Hall:</strong> {selectedEvent.details.lectureHall}
            </p>
            {selectedEvent.details.originalDate && (
              <p>
                <strong>Original Date:</strong>{" "}
                {selectedEvent.details.originalDate}
              </p>
            )}
            {selectedEvent.details.rescheduledDate && (
              <p>
                <strong>Rescheduled Date:</strong>{" "}
                {selectedEvent.details.rescheduledDate}
              </p>
            )}
            {selectedEvent.details.reason && (
              <p>
                <strong>Reason:</strong> {selectedEvent.details.reason}
              </p>
            )}
            <button
              onClick={closeModal}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;
