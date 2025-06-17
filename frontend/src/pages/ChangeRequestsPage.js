import React, { useState, useContext, useMemo } from "react";
import { Box, Container, CircularProgress } from "@mui/material";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { pl } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "../api/apiService";
import { AuthContext } from "../contexts/AuthContext";
import EventDialog from "../features/Calendar/EventDialog";
import ChangeRequestDialog from "../features/Calendar/ChangeRequestDialog";

import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { pl: pl };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});
const availableViews = [Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA];

const calendarMessages = {
  date: "Data",
  time: "Czas",
  event: "Wydarzenie",
  allDay: "Cały dzień",
  week: "Tydzień",
  work_week: "Tydzień roboczy",
  day: "Dzień",
  month: "Miesiąc",
  previous: "Poprzedni",
  next: "Następny",
  yesterday: "Wczoraj",
  tomorrow: "Jutro",
  today: "Dziś",
  agenda: "Agenda",
  noEventsInRange: "Brak wydarzeń w tym zakresie.",
};

const getSlotTimes = (day, slot) => {
  const slotTimes = [
    { start: "08:00", end: "09:30" },
    { start: "09:45", end: "11:15" },
    { start: "11:30", end: "13:00" },
    { start: "13:15", end: "14:45" },
    { start: "15:00", end: "16:30" },
    { start: "16:45", end: "18:15" },
    { start: "18:30", end: "20:00" },
  ];
  const { start, end } = slotTimes[slot - 1];
  const startDate = new Date(`${day}T${start}`);
  const endDate = new Date(`${day}T${end}`);
  return { start: startDate, end: endDate };
};

const useCalendarEvents = () => {
  const { user } = useContext(AuthContext);

  const queryKey = useMemo(
    () => ["calendarEvents", user?.role, user?.id],
    [user]
  );

  const fetchEvents = async () => {
    let courses = await apiRequest("/courses");

    if (user.role === "PROWADZACY") {
      courses = courses.filter((c) => c.teacher_id === user.id);
    } else if (user.role === "STAROSTA") {
      const groups = await apiRequest("/groups");
      const myGroupIds = groups
        .filter((g) => g.leader_id === user.id)
        .map((g) => g.id);
      courses = courses.filter((c) => myGroupIds.includes(c.group_id));
    }

    const eventPromises = courses.map((course) =>
      apiRequest(`/courses/${course.id}/events`).then((events) =>
        events.map((event) => ({
          ...event,
          courseName: course.name,
          courseId: course.id,
        }))
      )
    );

    const eventsByCourse = await Promise.all(eventPromises);
    return eventsByCourse.flat();
  };

  const {
    data: rawEvents,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey,
    queryFn: fetchEvents,
    enabled: !!user,
  });

  const calendarEvents = useMemo(() => {
    if (!rawEvents) return [];
    return rawEvents
      .map((event) => {
        if (event.canceled) return null;
        const { start, end } = getSlotTimes(event.day, event.time_slot_id);
        return {
          ...event,
          id: `${event.courseId}-${event.id}`,
          title: event.courseName,
          start,
          end,
        };
      })
      .filter(Boolean);
  }, [rawEvents]);

  return { events: calendarEvents, isLoading, isError, error };
};

const ChangeRequestsPage = () => {
  const { events, isLoading } = useCalendarEvents();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [changeDialogOpen, setChangeDialogOpen] = useState(false);

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setEventDialogOpen(true);
  };

  const handleProposeChange = () => {
    setEventDialogOpen(false);
    setChangeDialogOpen(true);
  };

  return (
    <Container maxWidth="xl" sx={{ p: 0, height: "calc(100vh - 120px)" }}>
      {isLoading && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <CircularProgress />
        </Box>
      )}
      <Calendar
        localizer={localizer}
        culture="pl"
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={availableViews}
        onSelectEvent={handleSelectEvent}
        messages={calendarMessages}
        style={{
          opacity: isLoading ? 0.5 : 1,
          backgroundColor: "#FFFFFF",
          padding: "1rem",
          borderRadius: "8px",
        }}
      />

      <EventDialog
        event={selectedEvent}
        open={eventDialogOpen}
        onClose={() => setEventDialogOpen(false)}
        onProposeChange={handleProposeChange}
      />
      <ChangeRequestDialog
        event={selectedEvent}
        open={changeDialogOpen}
        onClose={() => setChangeDialogOpen(false)}
      />
    </Container>
  );
};

export default ChangeRequestsPage;
