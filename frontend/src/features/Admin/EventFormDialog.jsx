import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    FormControlLabel,
    Checkbox,
    Stack,
    CircularProgress,
} from "@mui/material";
import { apiRequest } from "../../api/apiService.js";

const EventFormDialog = ({ open, onClose, onSave, initialData }) => {
    const [form, setForm] = useState({
        course_id: "",
        room_id: "",
        day: "",
        time_slot_id: "",
    });
    const [repeatWeekly, setRepeatWeekly] = useState(false);
    const [courses, setCourses] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const predefinedTimeSlots = [
        { id: 1, start_time: "08:00", end_time: "09:30" },
        { id: 2, start_time: "09:45", end_time: "11:15" },
        { id: 3, start_time: "11:30", end_time: "13:00" },
        { id: 4, start_time: "13:15", end_time: "14:45" },
        { id: 5, start_time: "15:00", end_time: "16:30" },
        { id: 6, start_time: "16:45", end_time: "18:15" },
        { id: 7, start_time: "18:30", end_time: "20:00" },
    ];


    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [coursesData, roomsData] = await Promise.all([
                    apiRequest("/courses"),
                    apiRequest("/rooms"),
                ]);
                setCourses(coursesData || []);
                setRooms(roomsData || []);
            } catch (err) {
                console.error("Błąd ładowania danych formularza:", err);
                setCourses([]);
                setRooms([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (initialData) {
            setForm(initialData);
        } else {
            setForm({
                course_id: "",
                room_id: "",
                day: "",
                time_slot_id: "",
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async () => {
        if (!form.course_id || !form.room_id || !form.day || !form.time_slot_id) {
            alert("Wypełnij wszystkie pola.");
            return;
        }

        const payload = {
            ...form,
            course_id: parseInt(form.course_id, 10),
            room_id: parseInt(form.room_id, 10),
            day: form.day,
            time_slot_id: parseInt(form.time_slot_id, 10),
        };

        try {
            await onSave(payload, repeatWeekly);
            onClose();
        } catch (error) {
            console.error("Błąd przy zapisie wydarzenia:", error);
            alert(
                error?.response?.data?.detail ||
                error.message ||
                "Wystąpił błąd podczas zapisu wydarzenia."
            );
        }
    };




    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Dodaj wydarzenie</DialogTitle>
            <DialogContent>
                {loading ? (
                    <Stack alignItems="center" mt={3}>
                        <CircularProgress />
                    </Stack>
                ) : (
                    <Stack spacing={2} mt={1}>
                        {/* Kurs */}
                        <TextField
                            select
                            label="Kurs"
                            name="course_id"
                            value={form.course_id}
                            onChange={handleChange}
                            fullWidth
                        >
                            {Array.isArray(courses) && courses.length > 0 ? (
                                courses.map((c) => (
                                    <MenuItem key={c.id} value={c.id}>
                                        {c.name} ({c.group?.name || "brak grupy"})
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem disabled value="">
                                    Brak dostępnych kursów
                                </MenuItem>
                            )}
                        </TextField>

                        {/* Sala */}
                        <TextField
                            select
                            label="Sala"
                            name="room_id"
                            value={form.room_id}
                            onChange={handleChange}
                            fullWidth
                        >
                            {Array.isArray(rooms) && rooms.length > 0 ? (
                                rooms.map((r) => (
                                    <MenuItem key={r.id} value={r.id}>
                                        {r.name}
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem disabled value="">
                                    Brak dostępnych sal
                                </MenuItem>
                            )}
                        </TextField>
                        {/* Dzień */}
                        <TextField
                            label="Data wydarzenia"
                            name="day"
                            type="date"
                            value={form.day}
                            onChange={handleChange}
                            fullWidth
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />


                        {/* Slot czasowy */}
                        <TextField
                            select
                            label="Slot czasowy"
                            name="time_slot_id"
                            value={form.time_slot_id}
                            onChange={handleChange}
                            fullWidth
                        >
                            {predefinedTimeSlots.map((t) => (
                                <MenuItem key={t.id} value={t.id}>
                                    {t.start_time} - {t.end_time}
                                </MenuItem>
                            ))}
                        </TextField>

                        {/* Checkbox */}
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={repeatWeekly}
                                    onChange={() => setRepeatWeekly((prev) => !prev)}
                                />
                            }
                            label="Powtarzaj co tydzień do końca czerwca"
                        />
                    </Stack>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Anuluj</Button>
                <Button onClick={handleSubmit} variant="contained">
                    Zapisz
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EventFormDialog;
