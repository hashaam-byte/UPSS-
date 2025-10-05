"use client";
import React, { useEffect, useState } from "react";

export default function StudentAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/protected/students/attendance") // Updated API endpoint
      .then((res) => res.json())
      .then((data) => {
        setAttendance(data.attendance || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load attendance");
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  return (
    <div>
      <h1>Student Attendance</h1>
      <pre>{JSON.stringify(attendance, null, 2)}</pre>
    </div>
  );
}
