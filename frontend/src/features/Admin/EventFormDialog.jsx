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
import axios from "axios";

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
    const [timeSlots, setTimeSlots] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [coursesRes, roomsRes, slotsRes] = await Promise.all([
                    axios.get("/courses"),
                    axios.get("/rooms"),
                    axios.get("/timeslots"),
                ]);
                setCourses(coursesRes?.data || []);
                setRooms(roomsRes?.data || []);
                setTimeSlots(slotsRes?.data || []);
            } catch (err) {
                console.error("Błąd ładowania danych formularza:", err);
                setCourses([]);
                setRooms([]);
                setTimeSlots([]);
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

    const handleSubmit = () => {
        if (!form.course_id || !form.room_id || !form.day || !form.time_slot_id) {
            alert("Wypełnij wszystkie pola.");
            return;
        }

        onSave(form, repeatWeekly);
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
                                        {c.name}
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

                        {/* Slot czasowy */}
                        <TextField
                            select
                            label="Slot czasowy"
                            name="time_slot_id"
                            value={form.time_slot_id}
                            onChange={handleChange}
                            fullWidth
                        >
                            {Array.isArray(timeSlots) && timeSlots.length > 0 ? (
                                timeSlots.map((t) => (
                                    <MenuItem key={t.id} value={t.id}>
                                        {t.start_time} - {t.end_time}
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem disabled value="">
                                    Brak slotów czasowych
                                </MenuItem>
                            )}
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
