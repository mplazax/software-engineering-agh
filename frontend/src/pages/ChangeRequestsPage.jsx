import React, { useState, useContext, useMemo } from "react";
import {
  Box,
  Container,
  CircularProgress,
  useTheme,
  Typography,
} from "@mui/material";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { pl } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "../api/apiService.js";
import { AuthContext } from "../contexts/AuthContext.jsx";
import EventDialog from "../features/Calendar/EventDialog.jsx";
import ChangeRequestDialog from "../features/Calendar/ChangeRequestDialog.jsx";

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
  const { start, end } = slotTimes[slot - 1] || {
    start: "00:00",
    end: "00:00",
  };
  return {
    start: new Date(`${day}T${start}`),
    end: new Date(`${day}T${end}`),
  };
};

const useFilteredCalendarEvents = () => {
  const { user } = useContext(AuthContext);

  const { data: allEvents = [], ...queryResult } = useQuery({
    queryKey: ["allEventsWithDetails"],
    queryFn: () => apiRequest("/courses/events/all"),
    enabled: !!user,
  });

  const filteredEvents = useMemo(() => {
    if (!user || !allEvents.length) return [];
    if (user.role === "ADMIN" || user.role === "KOORDYNATOR") {
      return allEvents;
    }

    let userGroupId;
    if (user.role === "STAROSTA") {
      const group = allEvents.find((e) => e.course.group.leader_id === user.id)
        ?.course.group;
      userGroupId = group?.id;
    }

    return allEvents.filter((event) => {
      if (user.role === "PROWADZACY") {
        return event.course.teacher_id === user.id;
      }
      if (user.role === "STAROSTA") {
        return event.course.group_id === userGroupId;
      }
      return false;
    });
  }, [allEvents, user]);

  const calendarEvents = useMemo(() => {
    return filteredEvents.map((event) => {
      const { start, end } = getSlotTimes(event.day, event.time_slot_id);
      return {
        ...event,
        id: `evt-${event.id}`,
        title: event.course.name,
        start,
        end,
        isCanceled: event.canceled,
      };
    });
  }, [filteredEvents]);

  return { events: calendarEvents, ...queryResult };
};

const WeekAndDayEvent = ({ event }) => {
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        p: "4px 8px",
      }}
    >
      <Box>
        <Typography
          variant="body2"
          sx={{ fontWeight: "bold", lineHeight: 1.2 }}
        >
          {event.title}
        </Typography>
        <Typography
          variant="caption"
          sx={{ lineHeight: 1.1, display: "block" }}
        >
          gr. {event.course.group.name}, {event.room?.name || "(on-line)"}
        </Typography>
      </Box>
    </Box>
  );
};

const MonthEvent = ({ event }) => {
  return (
    <Box
      sx={{
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        fontSize: "0.8rem",
        p: "0 4px",
      }}
    >
      <Typography
        variant="caption"
        component="span"
        sx={{ fontWeight: "bold" }}
      >
        {format(event.start, "H:mm")}
      </Typography>{" "}
      {event.title}
    </Box>
  );
};

const ChangeRequestsPage = () => {
  const theme = useTheme();
  const { events, isLoading } = useFilteredCalendarEvents();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [changeDialogOpen, setChangeDialogOpen] = useState(false);

  const handleSelectEvent = (event) => {
    if (event.isCanceled) return;
    setSelectedEvent(event);
    setEventDialogOpen(true);
  };

  const handleProposeChange = () => {
    setEventDialogOpen(false);
    setChangeDialogOpen(true);
  };

  const eventStyleGetter = (event) => {
    let style;
    if (event.isCanceled) {
      style = {
        backgroundColor: theme.palette.event.canceledBg,
        color: theme.palette.event.canceled,
        border: `1px dashed ${theme.palette.event.canceled}`,
        textDecoration: "line-through",
      };
    } else {
      style = {
        backgroundColor: theme.palette.event.custom,
        color: theme.palette.event.customText,
        border: `1px solid ${theme.palette.event.customBorder}`,
        boxShadow: "none",
      };
    }
    return {
      style: { ...style, borderRadius: "4px", opacity: 1, cursor: "pointer" },
    };
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
      <Box
        sx={{
          height: "100%",
          opacity: isLoading ? 0.5 : 1,
          ".rbc-event": { p: 0 },
          ".rbc-event-content": {
            display: "flex",
            height: "100%",
            width: "100%",
          },
        }}
      >
        <Calendar
          localizer={localizer}
          culture="pl"
          events={events}
          startAccessor="start"
          endAccessor="end"
          views={availableViews}
          onSelectEvent={handleSelectEvent}
          messages={calendarMessages}
          eventPropGetter={eventStyleGetter}
          components={{
            week: { event: WeekAndDayEvent },
            day: { event: WeekAndDayEvent },
            month: { event: MonthEvent },
            agenda: { event: WeekAndDayEvent },
          }}
          scrollToTime={new Date(0, 0, 0, 8)}
          min={new Date(0, 0, 0, 7, 0, 0)}
          max={new Date(0, 0, 0, 20, 30, 0)}
        />
      </Box>

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
