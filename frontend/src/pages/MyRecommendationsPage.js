import React, { useContext, useEffect, useState } from "react";
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    Divider,
    Paper,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from "@mui/material";
import Navbar from "../components/Navbar";
import { apiRequest } from "../services/apiService";
import { UserContext } from "../App";
import { useNavigate } from "react-router-dom";

const MyRecommendationsPage = () => {
    const { user, loading } = useContext(UserContext);
    const [changeRequests, setChangeRequests] = useState([]);
    const [coursesMap, setCoursesMap] = useState({});
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [roomNames, setRoomNames] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !localStorage.getItem("token")) {
            navigate("/login", { replace: true });
        }

        if (!loading && user) {
            fetchRelatedRequests();
            fetchCourses();
        }
    }, [loading, user, navigate]);

    const fetchRelatedRequests = async () => {
        try {
            const result = await apiRequest("/change_requests/related?limit=1000");
            setChangeRequests(result);
        } catch (error) {
            console.error("Błąd podczas pobierania powiązanych zgłoszeń zmian:", error);
        }
    };

    const fetchCourses = async () => {
        try {
            const courses = await apiRequest("/courses/");
            const newCoursesMap = {};
            const eventToCourseMap = {};
            const eventDayMap = {};

            for (const course of courses) {
                newCoursesMap[course.id] = course.name || `Kurs ${course.id}`;
                const events = await apiRequest(`/courses/${course.id}/events`);

                for (const event of events) {
                    eventToCourseMap[event.id] = course.id;
                    eventDayMap[event.id] = event.day;
                }
            }

            setCoursesMap(newCoursesMap);

            setChangeRequests(prev =>
                prev.map((req) => ({
                    ...req,
                    course_id: eventToCourseMap[req.course_event_id] || null,
                    event_day: eventDayMap[req.course_event_id] || null,
                }))
            );
        } catch (error) {
            console.error("Błąd podczas pobierania kursów i wydarzeń:", error);
        }
    };



    const fetchRecommendations = async (changeRequestId) => {
        try {
            const result = await apiRequest(`/change_recommendation/${changeRequestId}/recommendations`);
            setRecommendations(result);

            // Pobierz nazwy sal jeśli jeszcze nieznane
            const uniqueRoomIds = [...new Set(result.map(r => r.recommended_room_id))];
            for (const roomId of uniqueRoomIds) {
                if (!roomNames[roomId]) {
                    try {
                        const room = await apiRequest(`/rooms/${roomId}`);
                        setRoomNames(prev => ({ ...prev, [roomId]: room.name }));
                    } catch (e) {
                        console.warn(`Nie udało się pobrać sali ${roomId}`);
                    }
                }
            }
        } catch (error) {
            console.error("Błąd podczas pobierania rekomendacji:", error);
        }
    };

    const handleSelectChangeRequest = (e) => {
        const requestId = e.target.value;
        setSelectedRequestId(requestId);
        fetchRecommendations(requestId);
    };

    const formatSlotTime = (slotId) => {
        const slots = [
            "08:00 - 09:30",
            "09:45 - 11:15",
            "11:30 - 13:00",
            "13:15 - 14:45",
            "15:00 - 16:30",
            "16:45 - 18:15",
            "18:30 - 20:00",
        ];
        return slots[slotId - 1] || `Slot ${slotId}`;
    };

    return (
        <Box>
            <Navbar />
            <Box padding={4}>
                <Typography variant="h4" gutterBottom>
                    Rekomendacje dla Twoich zgłoszeń zmian
                </Typography>

                <FormControl fullWidth sx={{ marginBottom: 3 }}>
                    <InputLabel>Wybierz zgłoszenie zmiany</InputLabel>
                    <Select
                        value={selectedRequestId || ""}
                        onChange={handleSelectChangeRequest}
                        label="Wybierz zgłoszenie zmiany"
                    >
                        {changeRequests.map((request) => (
                            <MenuItem key={request.id} value={request.id}>
                                {`${coursesMap[request.course_id] || "Nieznany kurs"}: ${request.reason} (${request.event_day ? new Date(request.event_day).toLocaleDateString() : "brak daty"})`}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {recommendations.length > 0 ? (
                    <Paper elevation={3}>
                        <List>
                            {recommendations.map((rec) => (
                                <React.Fragment key={rec.id}>
                                    <ListItem>
                                        <ListItemText
                                            primary={`Data: ${rec.recommended_day}`}
                                            secondary={
                                                <>
                                                    <div>Slot: {formatSlotTime(rec.recommended_slot_id)}</div>
                                                    <div>Sala: {roomNames[rec.recommended_room_id] || rec.recommended_room_id}</div>
                                                </>
                                            }
                                        />
                                    </ListItem>
                                    <Divider />
                                </React.Fragment>
                            ))}
                        </List>
                    </Paper>
                ) : (
                    selectedRequestId && (
                        <Typography variant="body1">Brak rekomendacji dla wybranego zgłoszenia.</Typography>
                    )
                )}
            </Box>
        </Box>
    );
};

export default MyRecommendationsPage;
