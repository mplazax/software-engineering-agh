import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../api/apiService";

export const useAllEvents = () => {
    const fetchEvents = async () => {
        const courses = await apiRequest("/courses");

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

    return useQuery({
        queryKey: ["allEvents"],
        queryFn: fetchEvents,
    });
};
