
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Users, Settings, BellRing, LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

// Placeholder type for Team, eventually move to src/types
interface Team {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
  // activeAlarms?: number; // For future use
}

export default function TeamsFeature() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [newTeamName, setNewTeamName] = useState('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);

  useEffect(() => {
    if (!user) {
      setUserTeams([]);
      setIsLoadingTeams(false);
      return;
    }

    setIsLoadingTeams(true);
    const teamsCollectionRef = collection(db, "teams");
    const q = query(teamsCollectionRef, where("members", "array-contains", user.uid));

    const unsubscribe: Unsubscribe = onSnapshot(q, (querySnapshot) => {
      const teamsData: Team[] = [];
      querySnapshot.forEach((doc) => {
        teamsData.push({ id: doc.id, ...doc.data() } as Team);
      });
      setUserTeams(teamsData);
      setIsLoadingTeams(false);
    }, (error) => {
      console.error("Error fetching teams:", error);
      toast({ title: "Error Fetching Teams", description: "Could not load your teams. Please try again.", variant: "destructive" });
      setIsLoadingTeams(false);
    });

    return () => unsubscribe(); // Cleanup listener on unmount or when user changes
  }, [user, toast]);


  const handleCreateTeam = async () => {
    if (!user) {
      toast({ title: "Not Authenticated", description: "You must be logged in to create a team.", variant: "destructive" });
      return;
    }
    if (!newTeamName.trim()) {
      toast({ title: "Team Name Required", description: "Please enter a name for your team.", variant: "destructive" });
      return;
    }

    setIsCreatingTeam(true);
    try {
      const teamsCollectionRef = collection(db, "teams");
      await addDoc(teamsCollectionRef, {
        name: newTeamName.trim(),
        ownerId: user.uid,
        members: [user.uid], // Initially, only the creator is a member
        createdAt: serverTimestamp(),
      });
      toast({ title: "Team Created!", description: `Team "${newTeamName.trim()}" successfully created.` });
      setNewTeamName('');
    } catch (error) {
      console.error("Error creating team:", error);
      toast({ title: "Error Creating Team", description: "Could not create the team. Please try again.", variant: "destructive" });
    } finally {
      setIsCreatingTeam(false);
    }
  };

  if (authLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6 text-center">
        <div className="flex items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading user information...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 md:p-6 space-y-6 text-center">
        <Card className="shadow-md max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center justify-center">
              <LogIn className="mr-2 h-6 w-6" /> Please Sign In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Sign in to create and manage your teams for shared alarms.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Create New Team</CardTitle>
          <CardDescription>Give your new team a name.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="newTeamName">Team Name</Label>
            <Input
              id="newTeamName"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="e.g., Morning Workout Crew"
              disabled={isCreatingTeam}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleCreateTeam} disabled={isCreatingTeam || !newTeamName.trim()}>
            {isCreatingTeam ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Team
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Your Teams</CardTitle>
          <CardDescription>Manage your teams and their shared alarms.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTeams ? (
            <div className="flex items-center justify-center text-muted-foreground py-8">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading your teams...
            </div>
          ) : userTeams.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              You haven't created or joined any teams yet. Create one above!
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userTeams.map((team) => (
                <Card key={team.id} className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate" title={team.name}>{team.name}</span>
                      <Button variant="ghost" size="icon" disabled>
                        <Settings className="h-4 w-4" />
                        <span className="sr-only">Manage Team</span>
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Users className="mr-2 h-4 w-4" />
                      <span>{team.members.length} Member{team.members.length === 1 ? '' : 's'}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <BellRing className="mr-2 h-4 w-4" />
                      {/* Placeholder for active alarms count */}
                      <span>0 Active Team Alarms</span>
                    </div>
                  </CardContent>
                  <CardContent className="pt-0">
                     <Button variant="outline" className="w-full mt-2" disabled>
                        View Team Details (WIP)
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>About Team Alarms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            This "Teams" section is where you will manage groups for shared alarms. Fully implementing this feature involves:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-4">
            <li><strong>User Authentication:</strong> Secure sign-up and login for users (Firebase Authentication is now set up!).</li>
            <li><strong>Database Setup (Firestore):</strong> Collections for storing user profiles, team details (name, members), and shared team alarms. You've initialized Firestore and can now create teams.</li>
            <li><strong>Team Creation & Management UI:</strong> Forms to create teams, invite members (e.g., by email), and manage roles. (Creation part added, fetching and display added).</li>
            <li><strong>Member Management:</strong> Ability to add/remove team members. (Next step)</li>
            <li><strong>Shared Alarm Logic:</strong>
              <ul className="list-disc list-inside space-y-1 pl-6 mt-1">
                <li>Modifying the alarm creation form to select a team.</li>
                <li>Backend logic (e.g., Firebase Cloud Functions) to check for due team alarms.</li>
                <li>Real-time notifications (e.g., using Firestore listeners or FCM push notifications) to alert all team members.</li>
              </ul>
            </li>
            <li><strong>Permissions & Security Rules:</strong> Firestore rules to control data access. (Basic rules provided).</li>
          </ul>
          <p>
            The "Alarm Type" selector in the alarm creation dialog is a conceptual UI element. True team alarm functionality requires further backend and UI development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

    