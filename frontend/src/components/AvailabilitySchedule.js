import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import '../App.css';

const AvailabilitySchedule = () => {
  const [selectedSlots, setSelectedSlots] = useState(new Set());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  // Generate time slots from 8:00 to 18:30 with 1.5h duration and 15min breaks
  const timeSlots = Array.from({ length: 7 }, (_, i) => {
    const totalMinutes = 8 * 60 + i * 105; // 8:00 + i * (1.5h + 15min)
    const startHour = Math.floor(totalMinutes / 60);
    const startMinutes = totalMinutes % 60;
    const endTotalMinutes = totalMinutes + 90; // Add 1.5h for end time
    const endHour = Math.floor(endTotalMinutes / 60);
    const endMinutes = endTotalMinutes % 60;
    
    return {
      start: `${startHour.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`,
      end: `${endHour.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
    };
  });

  // Get dates for the current week
  const getWeekDates = (date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay() + 1); // Start from Monday
    return Array.from({ length: 5 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  };

  const weekDates = getWeekDates(currentDate);

  const handleSlotClick = (date, timeSlot) => {
    const slotKey = `${date.toISOString().split('T')[0]}-${timeSlot.start}-${timeSlot.end}`;
    setSelectedSlots(prev => {
      const newSlots = new Set(prev);
      if (newSlots.has(slotKey)) {
        newSlots.delete(slotKey);
      } else {
        newSlots.add(slotKey);
      }
      return newSlots;
    });
  };

  const handleWeekChange = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
    setSelectedDay(null);
  };

  const handleTodayClick = () => {
    setCurrentDate(new Date());
    setSelectedDay(null);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('pl-PL', { 
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="main-page">
      <Navbar />
      <div className="availability-container">
        <h2>Wskaż swoje dostępne terminy</h2>
        <p>Zaznacz okienka, w których jesteś dostępny</p>
        
        <div className="date-navigation">
          <button onClick={() => handleWeekChange(-1)}>← Poprzedni tydzień</button>
          <button onClick={handleTodayClick}>Dzisiejszy tydzień</button>
          <button onClick={() => handleWeekChange(1)}>Następny tydzień →</button>
        </div>

        {selectedDay ? (
          <div className="day-view">
            <h3>{formatDate(selectedDay)}</h3>
            <button onClick={() => setSelectedDay(null)}>← Wróć do widoku tygodnia</button>
            <div className="time-slots-grid">
              {timeSlots.map((slot, index) => {
                const slotKey = `${selectedDay.toISOString().split('T')[0]}-${slot.start}-${slot.end}`;
                const isSelected = selectedSlots.has(slotKey);
                return (
                  <div
                    key={index}
                    className={`time-slot ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSlotClick(selectedDay, slot)}
                  >
                    <span>{slot.start} - {slot.end}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="calendar-grid">
            <div className="time-column">
              <div className="header-cell">Godzina</div>
              {timeSlots.map((slot, index) => (
                <div key={index} className="time-cell">
                  {slot.start} - {slot.end}
                </div>
              ))}
            </div>
            {weekDates.map((date, dayIndex) => (
              <div key={dayIndex} className="day-column">
                <div 
                  className="header-cell clickable"
                  onClick={() => setSelectedDay(date)}
                >
                  {formatDate(date)}
                </div>
                {timeSlots.map((slot, timeIndex) => {
                  const slotKey = `${date.toISOString().split('T')[0]}-${slot.start}-${slot.end}`;
                  const isSelected = selectedSlots.has(slotKey);
                  return (
                    <div
                      key={timeIndex}
                      className={`time-slot ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSlotClick(date, slot)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        )}
        
        <button className="save-button">Zapisz dostępność</button>
      </div>
    </div>
  );
};

export default AvailabilitySchedule;