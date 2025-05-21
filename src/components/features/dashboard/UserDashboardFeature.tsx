
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserStats {
  alarmsSet?: number;
  pomodorosCompleted?: number;
  countdownsCreated?: number;
}

export default function UserDashboardFeature() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      setStats(null); 

      if (user) {
        try {
          const userDocRef = doc(db, 'userStats', user.id); // Changed collection name
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setStats(userDocSnap.data() as UserStats);
          } else {
            setStats({});
          }
        } catch (err) {
          console.error("Error fetching user stats:", err);
          setError("Failed to load user statistics.");
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]); 

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h2 className="text-xl sm:text-2xl font-semibold">User Statistics</h2>

      {loading && <p className="text-center text-muted-foreground">Loading statistics...</p>}
      {error && <p className="text-center text-destructive">{error}</p>}

      {!user && !loading && (
        <p className="text-center text-muted-foreground">
          Sign in to view your personal statistics.
        </p>
      )}

      {user && !loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="p-4 border rounded-md shadow-sm bg-card">
            <h3 className="text-lg font-medium">Alarms Set</h3>
            <p className="text-2xl font-bold text-primary">{stats?.alarmsSet ?? 0}</p>
          </div>
          <div className="p-4 border rounded-md shadow-sm bg-card">
            <h3 className="text-lg font-medium">Pomodoros Completed</h3>
            <p className="text-2xl font-bold text-primary">{stats?.pomodorosCompleted ?? 0}</p>
          </div>
          <div className="p-4 border rounded-md shadow-sm bg-card">
            <h3 className="text-lg font-medium">Custom Countdowns Created</h3>
            <p className="text-2xl font-bold text-primary">{stats?.countdownsCreated ?? 0}</p>
          </div>
        </div>
      )}
    </div>
  );
}
