import React, { useState, useMemo, useCallback } from "react";
import { Container, Stack, IconButton, Box } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SchoolIcon from "@mui/icons-material/School";
import { useQuery } from "@tanstack/react-query";

import { useCrud } from "../hooks/useCrud.js";
import AdminDataGrid from "../features/Admin/AdminDataGrid.jsx";
import CourseFormDialog from "../features/Admin/CourseFormDialog.jsx";
import { apiRequest } from "../api/apiService.js";

const useIdToNameMap = (
  queryKey,
  endpoint,
  nameFormatter = (item) => item.name
) => {
  const { data = [] } = useQuery({
    queryKey,
    queryFn: () => apiRequest(endpoint),
  });
  return useMemo(
    () => new Map(data.map((item) => [item.id, nameFormatter(item)])),
    [data, nameFormatter]
  );
};

const CoursesPage = () => {
  const {
    items: courses,
    isLoading,
    isError,
    error,
    createItem,
    updateItem,
    deleteItem,
  } = useCrud("courses", "/courses");
  const teachersMap = useIdToNameMap(
    ["users"],
    "/users",
    (user) => `${user.name} ${user.surname}`
  );
  const groupsMap = useIdToNameMap(["groups"], "/groups");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);

  const handleAdd = () => {
    setCurrentCourse(null);
    setDialogOpen(true);
  };

  const handleEdit = useCallback((course) => {
    setCurrentCourse(course);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id) => {
      if (window.confirm("Czy na pewno chcesz usunąć ten kurs?")) {
        await deleteItem(id).catch((e) => alert(`Błąd: ${e.message}`));
      }
    },
    [deleteItem]
  );

  const handleSave = async (courseData) => {
    try {
      if (currentCourse) {
        await updateItem({ id: currentCourse.id, updatedItem: courseData });
      } else {
        await createItem(courseData);
      }
      setDialogOpen(false);
    } catch (e) {
      console.error("Save failed", e);
      return e;
    }
  };

  const columns = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 90 },
      {
        field: "name",
        headerName: "Nazwa Kursu",
        width: 300,
        renderCell: (params) => (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <SchoolIcon sx={{ mr: 1, color: "text.secondary" }} />
            {params.value}
          </Box>
        ),
      },
      {
        field: "teacher_id",
        headerName: "Prowadzący",
        flex: 1,
        valueGetter: (value) => teachersMap.get(value) || "Nieznany",
      },
      {
        field: "group_id",
        headerName: "Grupa",
        flex: 1,
        valueGetter: (value) => groupsMap.get(value) || "Nieznana",
      },
      {
        field: "actions",
        headerName: "Akcje",
        width: 120,
        sortable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={1}>
            <IconButton size="small" onClick={() => handleEdit(params.row)}>
              <EditIcon />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDelete(params.row.id)}
            >
              <DeleteIcon />
            </IconButton>
          </Stack>
        ),
      },
    ],
    [teachersMap, groupsMap, handleEdit, handleDelete]
  );

  return (
    <Container maxWidth="lg" sx={{ p: "0 !important" }}>
      <AdminDataGrid
        columns={columns}
        rows={courses}
        isLoading={isLoading || teachersMap.size === 0 || groupsMap.size === 0}
        isError={isError}
        error={error}
        onAddItem={handleAdd}
        toolbarConfig={{
          searchPlaceholder: "Szukaj po nazwie kursu...",
          addLabel: "Dodaj Kurs",
        }}
      />
      <CourseFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        course={currentCourse}
      />
    </Container>
  );
};

export default CoursesPage;
